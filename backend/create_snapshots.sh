#!/bin/bash

while true
do
    response=$(curl -X PUT "localhost:9200/_snapshot/backups/snapshot_$(date '+%s')?wait_for_completion=true&pretty")
    echo "Created snapshot $response"
    sleep 1h
done
