function GraphVisualization()
{
  'use strict';

  var color = d3.scale.category20b();

  function hash( s )
  {
    if ( !s )
    {
      return 0;
    }
    for ( var ret = 0, i = 0, len = s.length; i < len; i++ )
    {
      ret = ( 31 * ret + s.charCodeAt( i ) ) << 0;
    }
    return ret;
  }

  var ignore = {
    source : 1,
    target : 1,
    type : 1,
    selected : 1,
    index : 1,
    x : 1,
    y : 1,
    weight : 1,
    px : 1,
    py : 1,
    id : 1
  };

  function propertyHash( ob )
  {
    var ret = 0;
    for ( var prop in ob )
    {
      if ( ignore.hasOwnProperty( prop ) )
      {
        continue;
      }
      if ( ob.hasOwnProperty( prop ) )
      {
        ret += hash( prop );
      }
    }
    return ret;
  }

  function toString( ob )
  {
    var ret = '';
    for ( var prop in ob )
    {
      if ( ignore.hasOwnProperty( prop ) )
      {
        continue;
      }
      if ( ob.hasOwnProperty( prop ) )
      {
        ret += prop + ': ' + ob[prop] + ' ';
      }
    }
    return ret + 'id: ' + ob.id;
  }

  function labels( ob )
  {
    if ( !ob.labels || ob.labels.length == 0 )
    {
      return '';
    }
    return ':' + ob.labels.join( ':' ) + ' ';
  }

  function title( ob )
  {
    function _title( ob )
    {
      if ( ob.name )
      {
        return ob.name;
      }
      if ( ob.title )
      {
        return ob.title;
      }
      for ( var prop in ob )
      {
        if ( ignore.hasOwnProperty( prop ) || prop == 'labels' )
        {
          continue;
        }
        if ( ob.hasOwnProperty( prop ) )
        {
          return ob[prop];
        }
      }
      return ob.id;
    }
    return labels( ob ) + _title( ob );
  }

  function visualize( elementOrId, w, h, data )
  {
    var select = ( typeof elementOrId === 'string' ) ? '#' + elementOrId : elementOrId;
    var vis = d3.select( select ).append( 'svg' ).attr( 'class', 'd3-graph' ).attr( 'height', h )
        .attr( 'style', 'pointer-events:fill;');
//    console.log($(d3).width());
    var force = self.force = d3.layout.force().nodes( data.nodes ).links( data.links ).gravity( .2 ).distance( 80 )
        .charge( -1000 ).size([w, h]).start();

    // end-of-line arrow
    vis.append( 'svg:defs' ).selectAll( 'marker' ).data( [ 'end-marker' ] ) // link types if needed
    .enter().append( 'svg:marker' ).attr( 'viewBox', '0 -5 10 10' ).attr( 'refX', 25 ).attr( 'refY', -1.5 ).attr(
        'markerWidth', 4 ).attr( 'markerHeight', 4 ).attr( 'class', 'd3-marker' ).attr( 'orient', 'auto' ).append(
        'svg:path' ).attr( 'd', 'M0,-5L10,0L0,5' );

    var link = vis.selectAll( 'line.link' ).data( data.links ).enter().append( 'svg:line' ).attr( 'class', 'd3-link' )
        .attr( 'marker-end', 'url(#end-marker)' ) // was d.type
        .style( 'stroke', function( d )
        {
          return d['selected'] ? 'red' : null;
        } ).style( 'stroke-width', function( d )
        {
          return d['selected'] ? 2 : null;
        } ).attr( 'x1', function( d )
        {
          return d.source.x;
        } ).attr( 'y1', function( d )
        {
          return d.source.y;
        } ).attr( 'x2', function( d )
        {
          return d.target.x;
        } ).attr( 'y2', function( d )
        {
          return d.target.y;
        } );

    var node = vis.selectAll( 'g.node' ).data( data.nodes ).enter().append( 'circle' ).attr( 'class', 'd3-node' ).attr(
        'r', 5 ).style( 'fill', function( d )
    {
      return color( propertyHash( d ) % 20 );
    } ).style( 'stroke-width', function( d )
    {
      return d['selected'] ? 2 : 0;
    } ).style( 'stroke', function( d )
    {
      return d['selected'] ? 'red' /* was d3.rgb(color2(hash(sel) % 20)).brighter() */: null;
    } ).call( force.drag );

    node.append( 'title' ).text( function( d )
    {
      return toString( d );
    } ).attr( 'class', 'd3-text' );

    var text = vis.append( 'svg:g' ).selectAll( 'g' ).data( force.nodes() ).enter().append( 'svg:g' );

    // A copy of the text with a thick white stroke for legibility.
    text.append( 'svg:text' ).attr( 'x', 8 ).attr( 'y', '-.31em' ).attr( 'class', 'd3-text d3-shadow' ).text(
        function( d )
        {
          return title( d );
        } );

    text.append( 'svg:text' ).attr( 'x', 8 ).attr( 'y', '-.31em' ).attr( 'class', 'd3-text' ).text( function( d )
    {
      return title( d );
    } );

    var path_text = vis.append( 'svg:g' ).selectAll( 'g' ).data( force.links() ).enter().append( 'svg:g' );

    path_text.append( 'svg:text' ).attr( 'class', 'd3-path-text d3-shadow' ).text( function( d )
    {
      return d.type;
    } );

    path_text.append( 'svg:text' ).attr( 'class', 'd3-path-text' ).text( function( d )
    {
      return d.type;
    } );

    force.on( 'tick', function()
    {
      link.attr( 'x1', function( d )
      {
        return d.source.x;
      } ).attr( 'y1', function( d )
      {
        return d.source.y;
      } ).attr( 'x2', function( d )
      {
        return d.target.x;
      } ).attr( 'y2', function( d )
      {
        return d.target.y;
      } );

      text.attr( 'transform', function( d )
      {
        return 'translate(' + d.x + ',' + d.y + ')';
      } );

      node.attr( 'transform', function( d )
      {
        return 'translate(' + d.x + ',' + d.y + ')';
      } );

      path_text.attr( 'transform', function( d )
      {
        var dx = ( d.target.x - d.source.x ), dy = ( d.target.y - d.source.y );
        var dr = Math.sqrt( dx * dx + dy * dy );
        var sinus = dy / dr;
        var cosinus = dx / dr;
        var l = d.type.length * 6;
        var offset = ( 1 - ( l / dr ) ) / 2;
        var x = ( d.source.x + dx * offset );
        var y = ( d.source.y + dy * offset );
        return 'translate(' + x + ',' + y + ') matrix(' + cosinus + ', ' + sinus + ', ' + -sinus + ', ' + cosinus
            + ', 0 , 0)';
      } );

    } );
  }

  function render( id, w, h, url )
  {
    d3.json( url, function( data )
    {
      visualize( id, w, h, data );
    } );
  }

  return {
    'render' : render,
    'visualize' : visualize
  };
}
