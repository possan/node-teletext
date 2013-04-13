node-teletext
=============

A restful interface to the VBit open source teletext hardware
https://code.google.com/p/vbit/

Download all dependencies:
	npm install

Start service by running:
	node proxy.js

write some text to page 200:
	curl -X POST "http://localhost:8080/tti?page=200&file=OL,1,HELLO%20WORLD"

set the clock to 08:10:20:
	curl -X POST "http://localhost:8080/raw?command=0T081020"

upload a .tti page:
	php sendtti.php sample.tti
	curl -X POST "http://localhost:8080/tti?page=200&file=OL,1,HELLO%20WORLD"

running twitfax:
	php twitfax.php >twitter.tti
	iconv -f iso8859-1 -t utf-8 twitter.tti >twitter2.tti
	curl -X POST "http://localhost:8080/tti?page=200&filename=twitter2.tti"

run a raw custom command:
	curl -X POST "http://localhost:8080/raw?command=0JA,2"

