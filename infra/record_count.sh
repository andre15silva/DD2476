#!/bin/bash

# Create file
ctfile="results_count_$(date '+%s').csv"
> $ctfile

# Register count every 10 minutes
while true
do
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    COUNT=$(curl -s -X GET "localhost:9200/code/method/_count" | jq -r '.count')
    printf "$TIMESTAMP,$COUNT\n" >> $ctfile
    sleep 10m
done
