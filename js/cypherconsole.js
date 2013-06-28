/**
 * Licensed to Neo Technology under one or more contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership. Neo Technology licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You
 * may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*
 * Cypher Console Adds live cypher console feature to a page.
 */

var CONSOLE_URL_BASE = "http://console-test.neo4j.org/";
var CONSOLE_AJAX_ENDPOINT = CONSOLE_URL_BASE + "console/cypher";
var REQUEST_BASE = CONSOLE_URL_BASE + "?";
var $WRAPPER = $( '<div class="query-wrapper" />' );
var $IFRAME = $( "<iframe/>" ).attr( "id", "console" ).addClass( "cypherdoc-console" );
var ASCIIDOCTOR_OPTIONS = Opal.hash2( [ 'attributes' ], {
  'attributes' : [ 'notitle!' ]
} );
var DEFAULT_HASH = '#5880880';

$( window ).hashchange( renderPage );

function executeQueries()
{
  $( "div.query-wrapper" ).each( function( index, element )
  {
    var $wrapper = $( element );
    var statement = $wrapper.data( 'query' );
    execute( statement, function( results )
    {
      var data = JSON.parse( results );
      var viz = data['visualization'];
      var newlines = results.replace( /\\n/g, '&#013;' );
      if ( data.error )
      {
        $wrapper.after( "<span class='label label-important' title='" + newlines + "'>ERROR</span >" );
      }
      else
      {
        $wrapper.after( "<span class='label label-success' title='" + newlines + "'>OK</span >" );
        var graphEl = ".graph" + ( index + 1 );
        $( graphEl ).each( function( i, el )
        {
          var svg = d3.select( el ).append( "svg" );
          d3graph( viz, svg );
        } );
      }
    }, function( results )
    {
      console.log( "execution error", arguments );
    } );
  } );
}

function execute( statement, callback, error )
{
  $.ajax( {
    'type' : "POST",
    'url' : CONSOLE_AJAX_ENDPOINT,
    'data' : statement,
    'success' : callback,
    'error' : error,
    'async' : false
  } );
}

function sanitizeContents( content )
{
  var sanitized = content.replace( /^\/\/\s*?console/m, '++++\n<p class="console"></p>\n++++\n' );
  return sanitized.replace( /^\/\/\W*graph(.*)/gm, function( match, name )
  {
    return '++++\n<div>Graph after Query ' + name + '</div><div class="graph graph' + name + '"></div>\n++++\n';
  } );
}

function renderPage()
{
  if ( window.location.hash < 2 )
  {
    window.history.pushState( {}, "", DEFAULT_HASH );
  }
  var gist = window.location.hash.substr( 1 );
  if ( !/^\d+$/.test( gist ) )
  {
    // TODO scroll to the correct position as needed.
    // (offset for the wide console).
    // Probably we should capture the clicks and manage this ourselves somehow.
    return false;
  }
  var url = "https://api.github.com/gists/" + gist;
  $.ajax( {
    url : url,
    success : function( data )
    {
      var file = data.files[Object.keys( data.files )[0]];
      var content = file.content;
      $( "#gist_link" ).attr( "href", data.html_url );
      content = sanitizeContents( content );
      $content = $( '#content' );
      $content.empty();
      var generatedHtml = Opal.Asciidoctor.$render( content, ASCIIDOCTOR_OPTIONS );
      $content.html( generatedHtml );
      $( "code.cypher" ).each( function( index, el )
      {
        var number = ( index + 1 );
        var $el = $( el );
        $el.attr( "class", "brush: cypher" );
        $parent = $el.parent();
        $parent.prepend( "<h5>Query " + number + "</h5>" );
        $el.wrap( $WRAPPER.clone() ).each( function()
        {
          $el.parent().data( 'query', $el.text() );
        } );
      } );
      SyntaxHighlighter.config['tagName'] = 'code';
      SyntaxHighlighter.defaults['tab-size'] = 4;
      SyntaxHighlighter.defaults['gutter'] = false;
      SyntaxHighlighter.defaults['toolbar'] = false;
      SyntaxHighlighter.highlight();
      // transform image links to images
      $( 'a[href]', $content ).each( function()
      {
        var $link = $( this );
        if ( $link.text() === this.href && this.href.length > 4 )
        {
          var ext = this.href.split( '.' ).pop();
          if ( 'png|jpg|jpeg|svg'.indexOf( ext ) !== -1 )
          {
            $link.replaceWith( '<img src="' + this.href + '">' );
          }
        }
      } );
      executeQueries();
      createCypherConsole();
    },
    dataType : "json"
  } );
}

$( document ).ready( function()
{
  renderPage();
} );

function d3graph( graph, svg )
{
  var width = 500, height = 200;
  svg.attr( "width", width ).attr( "height", height );
  var color = d3.scale.category20();

  var force = d3.layout.force().charge( -120 ).linkDistance( 10 ).size( [ width, height ] );
  force.nodes( graph.nodes ).links( graph.links ).start();

  var link = svg.selectAll( ".link" ).data( graph.links ).enter().append( "line" ).attr( "class", "link" ).style(
      "stroke-width", function( d )
      {
        return Math.sqrt( d.value );
      } );

  var node = svg.selectAll( ".node" ).data( graph.nodes ).enter().append( "circle" ).attr( "class", "node" ).attr( "r",
      5 ).style( "fill", function( d )
  {
    return color( d.group );
  } ).call( force.drag );

  node.append( "title" ).text( function( d )
  {
    return d.name;
  } );

  force.on( "tick", function()
  {
    link.attr( "x1", function( d )
    {
      return d.source.x;
    } ).attr( "y1", function( d )
    {
      return d.source.y;
    } ).attr( "x2", function( d )
    {
      return d.target.x;
    } ).attr( "y2", function( d )
    {
      return d.target.y;
    } );

    node.attr( "cx", function( d )
    {
      return d.x;
    } ).attr( "cy", function( d )
    {
      return d.y;
    } );
  } );
}

function createCypherConsole()
{
  $( 'p.console' ).first().each( function()
  {
    var context = $( this );
    var url = getUrl( "none", "none", "\n\nClick the play buttons to run the queries!" );
    var iframe = $IFRAME.clone().attr( "src", url );
    context.append( iframe );
    context.height( iframe.height() );
    var button = $( '<button class="run-query" title="Execute query"><i class="icon-play"></i> </button>' );
    $( 'div.query-wrapper' ).append( button.clone().click( function()
    {
      var query = $( this ).parent().data( 'query' );
      $( '#console' )[0].contentWindow.postMessage( query, '*' );
    } ) );
    var offset = iframe.offset();
    if ( offset && offset.top )
    {
      var limit = offset.top;
      $window = $( window );
      $window.scroll( function()
      {
        if ( $window.scrollTop() > limit )
        {
          iframe.css( 'position', 'fixed' );
        }
        else
        {
          iframe.css( 'position', 'static' );
        }
      } );
    }
  } );

  function getUrl( database, command, message )
  {
    var url = REQUEST_BASE;
    if ( database !== undefined )
    {
      url += "init=" + encodeURIComponent( database );
    }
    if ( command !== undefined )
    {
      url += "&query=" + encodeURIComponent( command );
    }
    if ( message !== undefined )
    {
      url += "&message=" + encodeURIComponent( message );
    }
    if ( window.neo4jVersion != undefined )
    {
      url += "&version=" + encodeURIComponent( neo4jVersion );
    }
    return url + "&no_root=true";
  }
}