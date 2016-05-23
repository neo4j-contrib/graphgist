# How to run Neo4j GraphGists locally?

git clone https://github.com/neo4j-contrib/rabbithole
cd rabbithole
git checkout -b 3.0 origin/3.0
mvn clean test-compile 
mvn exec:java&

sleep 20

# GraphGists only run in your browser, so in your asciidoc-file use the attribute at the top :neo4j-version: local
# and it will connect to http://localhost:8080 for the neo4j-console

# If you don't trust us on this :) you can also run the graphgist locally

cd ..
git clone https://github.com/neo4j-contrib/graphgist
cd graphgist

sed -e 's/:neo4j-version:.*/:neo4j-version: local/g' gists/syntax.adoc > gists/my-graph-use-case.adoc

python -m SimpleHTTPServer&

open http://localhost:8000/index.html?http%3A%2F%2Flocalhost%3A8000%2Fgists%2Fmy-graph-use-case.adoc

# you can put your graphgist files e.g. in graphgist/gists and access them with http://localhost:8000/gists/my-graph-use-case.adoc to paste into the URL-box

