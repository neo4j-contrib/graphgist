The Neo4j GraphGists
====================

For the live site, go to [The GraphGists](http://gist.neo4j.org/).

For a loose collection of cool Gists, see [the GraphGist Collection](https://github.com/neo4j-contrib/graphgist/wiki).

Building
-----------

    git clone git@github.com:neo4j-contrib/graphgist.git
    
    cd graphgist
    
    # install yeoman command line tools 
    npm install -g yo
    
    # install local node modules
    npm install
    
    # install local vendor files with bower
    bower install
    
    # to develop
    grunt serve

    # to build "site" and deploy to gh-pages
    grunt release --seriously
