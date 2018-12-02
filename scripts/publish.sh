#!/bin/bash
set -e

yarn vsce publish -p $AZURE_ACCESS_TOKEN 
