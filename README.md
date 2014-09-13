The Neo4j GraphGists
====================

For the live site, go to [The GraphGists](http://gist.neo4j.org/).

For a loose collection of cool Gists, see [the GraphGist Collection](https://github.com/neo4j-contrib/graphgist/wiki).

Building
-----------

    git clone git@github.com:neo4j-contrib/graphgist.git
    cd graphgist
    # install bower command line tools
    npm install -g bower
    # create static/vendor folder
    bower install
    # run a development server
    python -m SimpleHTTPServer
    
This is a static site, not further deployment needed. It is hosted via gh-pages.
