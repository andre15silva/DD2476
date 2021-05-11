# GJSE - GitHub Java code Search Engine
This repository is a part of our master's course in Search Engines and Information Retrieval.
The search engine uses Elastic Search to index GitHub and allow users to look for algorithms or specific methods (Java only)

# Run the engine
The engine is made up of two parts, the first one is the backend which is handled by elastic and the frontend which provides a web interface.

## Back-end
To allow for an easier installion of the backend we relied on docker.
### Pre-requisites
Install both `docker` and `docker-compose`.

Download the latest snapshot of our elasticsearch data from [GitHub](https://github.com/andre15silva/DD2476/releases).

Pull elasticsearch docker image with `docker pull elasticsearch:7.12.0`. Make sure your `docker` deamon is running.

### Installation
Extract the content of the elasticsearch data into the backend directory.
Start a shell in the project directory and:
```sh
cd backend/
docker-compose up
```
After the container is running, press `Ctrl+C` and stop it.

Copy the data to the container:
```sh
docker cp ./backend/elasticsearch/ elasticsearch:/usr/share/
```
Run the container again:
```sh
docker-compose up
```
Now, everything should be working with the latest version of the data.
## Front-end
The frontend has been developed using React. For this reason [npm](https://www.npmjs.com/get-npm) is required to run the front-end.
Now, from the frontend directory, install the project:
```bash
npm install
```
Then, start the frontend with:
```bash
npm start
```
It will take a few seconds to start.
The web interface can be access from any web browser at [http://localhost:3000](http://localhost:3000)

# Run the Scanner and Indexer
The scanner and the indexer are the components responsible for retrieving and indexing GitHub repository files. The latter relies on the former to run as it expects from standard input the links to each file.
In order to correctly run the scanner, the java code from the Indexer needs first to be compiled. In order to do so the following command can be used:
```sh
cd ./indexer
mvn install
```
Furthermore, to retrieve the repository information, the scanner needs access to a GitHub API token. API tokens for GitHub can be created at [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
Let `tokenlist.txt` be the file in which one or more tokens are stored, then the scanner can be run with the following commands:
```sh
cd ./indexer
python3 ../scanner/main.py --indexer "mvn exec:java -Dexec.args=\"../tokenlist.txt\"" --limit 100 --token-list ../tokenlist.txt
```