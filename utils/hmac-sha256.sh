#!/bin/sh

SECRET=$1
MESSAGE=$2

echo "echo -n $MESSAGE | openssl dgst -sha256 -hmac $SECRET -binary | base64"
