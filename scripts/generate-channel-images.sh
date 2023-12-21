#!/bin/bash

# Folder to save images
folder="../public/channels"

# Reset images folder at the start
rm -rf $folder
mkdir $folder

# Get JSON data
json=$(cat ../lib/channels.json)

# Parse JSON to get image URLs and channel IDs
data=$(echo $json | jq -r '.[] | "\(.imageUrl) \(.id)"')

# Loop through data, download each image, rename it to channel_id and resize it to 256x256
while read -r url id; do
  wget -O $folder/$id-original.jpg $url
  convert $folder/$id-original.jpg -resize 256x256 $folder/$id.jpg
  rm $folder/$id-original.jpg
done <<< "$data"





