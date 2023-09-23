#!/bin/bash

# Folder to save images
folder="../public/channels"

# Reset images folder at the start
rm -rf $folder
mkdir $folder

# Get JSON data
json=$(curl -s "https://raw.githubusercontent.com/neynarxyz/farcaster-channels/main/warpcast.json")

# Parse JSON to get image URLs and channel IDs
data=$(echo $json | jq -r '.[] | "\(.image) \(.channel_id)"')

# Loop through data, download each image, rename it to channel_id and resize it to 256x256
while read -r url id; do
  wget -O $folder/$id-original.jpg $url
  convert $folder/$id-original.jpg -resize 256x256 $folder/$id.jpg
  rm $folder/$id-original.jpg
done <<< "$data"





