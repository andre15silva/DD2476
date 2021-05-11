# How to get everything working with docker

You will need to install `docker` and `docker-compose`. Search for the instructions to install them in your OS.

Pull elasticsearch docker image with `docker pull elasticsearch:7.12.0`. Make sure your `docker` deamon is running.

Download the latest snapshot of elasticsearch from [GitHub](https://github.com/andre15silva/DD2476/releases).


## Init the container
Extract the content of the elasticfile into the backend directory.
Then:
```sh
cd backend/
docker-compose up
```

After the container is running, press `Ctrl+C` to stop it.

## Copy data to the container

```sh
docker cp <project_path>/backend/elasticsearch/ elasticsearch:/usr/share/
```

NOTE: Replace the source path accordingly.

## Run the container again

```sh
docker-compose up
```

Now, everything should be working with the latest version of the data.

## How to restore old snapshots

To restore old snapshots, you will have to delete the current index

```sh
curl -X DELETE "localhost:9200/code?pretty"
```

After this, you can restore a snapshot to have access to the state of the index at a certain time.

First, you can look up all the snapshots available with the following command:

```sh
curl -X GET "localhost:9200/_snapshot/backups/_all?pretty"
```

Note the times. The snapshots were taken every hour, with the first being at T0 and the last when the indexing process was stopped (latest version).

Now, after you choose a snapshot, copy its field `snapshot` and execute the following command:

```sh
curl -X POST "localhost:9200/_snapshot/backups/snapshot_XXXXXXXX/_restore?pretty"
```

Repeat the process to restore a different snapshot.
