#!/bin/bash

if ! command -v dotnet &> /dev/null; then
    echo ".NET SDK is not installed. Please install it from https://dotnet.microsoft.com/download"
    exit 1
fi

dotnet restore ../basic.csproj

dotnet build ../basic.csproj

echo "Build completed." 