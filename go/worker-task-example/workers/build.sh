#!/bin/bash

cd ..

go mod download
go mod tidy

echo "Build completed." 