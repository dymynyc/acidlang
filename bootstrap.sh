#!/bin/bash

output=bootstrap ./bin.js bootstrap *.al &&
output=bootstrap2 ./bin.js bootstrap2 *.al &&
output=dist ./bin.js bootstrap3 *.al &&
output=bootstrap3 ./bin.js build *.al &&
diff <(cd bootstrap3 && shasum *) <(cd dist && shasum *)