#!/bin/bash

# Clean index
echo "Cleaning index..."
echo $(curl -X DELETE "localhost:9200/code?pretty")
echo "Index clean"

# Install indexer
echo "Installing indexer..."
mvn clean install -DskipTests -B -f ../indexer/ 2>&1 > /dev/null
echo "Intalled indexer"

# Launch indexer
echo "Launching index..."
current_time=$(date '+%s')
filename="indexer_log_${current_time}.log"
stdbuf -oL python ../scanner/main.py --indexer "mvn exec:java -Dexec.args=\"../tokenlist.txt\" -f ../indexer" --token-list ../tokenlist.txt &> $filename &
indexer_pid=$!
echo "Lanched indexer with pid ${indexer_pid}"

# Launching scripts
echo "Launching record count script..."
./record_count.sh &
record_count_pid=$!
echo "Launched record count script with pid ${record_count_pid}"

echo "Launching snapshot script..."
./create_snapshots.sh &
create_snapshots_pid=$!
echo "Launched snapshot script with pid ${create_snapshots_pid}"

function clean_up {
    kill -9 $indexer_pid
    kill -9 $record_count_pid
    kill -9 $create_snapshots_pid
    echo "Killed them all, exiting..."
    exit
}

trap clean_up SIGHUP SIGINT SIGTERM

wait
echo "Everything done, shutting down..."
