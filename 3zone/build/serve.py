"""Isolated static preview, plus explicit private authoring routes."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from urllib.parse import urlsplit
from pathlib import Path
import sys, argparse
sys.path.insert(0,str(Path(__file__).resolve().parent))
from build import ROOT,build
from type_preview import render,OPTIONS
class Preview(SimpleHTTPRequestHandler):
 def __init__(self,*args,demo=False,**kwargs):
  self.demo=demo;super().__init__(*args,**kwargs)
 def end_headers(self):
  self.send_header('Cache-Control','no-store');super().end_headers()
 def do_GET(self):
  path=urlsplit(self.path).path
  if self.demo and path=='/':
   self.send_response(302);self.send_header('Location','/3zone/');self.end_headers();return
  if self.demo and path.startswith('/_preview/'):
   return self.send_error(404)
  if path in ('/_preview/type/','/_preview/type'):
   return self.private_response(render().encode('utf-8'),'text/html; charset=utf-8')
  if path=='/_preview/type.js':
   return self.private_file(ROOT/'build'/'type_preview.js','text/javascript; charset=utf-8')
  if path=='/_preview/type-comparison.png':
   return self.private_file(ROOT/'.local'/'type-preview'/'type-comparison.png','image/png')
  if path.startswith('/_preview/fonts/'):
   name=path[len('/_preview/fonts/'):]
   if name not in {item[3] for item in OPTIONS}:return self.send_error(404)
   return self.private_file(ROOT/'.local'/'type-preview'/'fonts'/name,'font/ttf')
  if path.startswith('/_preview/'):return self.send_error(404)
  super().do_GET()
 def private_file(self,path,content_type):
  if not path.is_file():return self.send_error(404)
  self.private_response(path.read_bytes(),content_type)
 def private_response(self,data,content_type):
  self.send_response(200);self.send_header('Content-Type',content_type);self.send_header('Content-Length',str(len(data)));self.send_header('X-Robots-Tag','noindex, nofollow');self.end_headers();self.wfile.write(data)
 def send_error(self,code,message=None,explain=None):
  if code==404:
   data=((ROOT/'demo'/'3zone' if self.demo else ROOT/'dist')/'404.html').read_bytes();self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
  else:super().send_error(code,message,explain)
if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--demo',action='store_true',help='Preview the copy-ready demo under /3zone/')
 parser.add_argument('--port',type=int,default=4180)
 args=parser.parse_args();build(demo=args.demo)
 print(f'3 Zone Recovery preview: http://127.0.0.1:{args.port}/'+('3zone/' if args.demo else ''),flush=True)
 if not args.demo:print(f'Private type comparison: http://127.0.0.1:{args.port}/_preview/type/',flush=True)
 directory=ROOT/'demo' if args.demo else ROOT/'dist'
 ThreadingHTTPServer(('127.0.0.1',args.port),partial(Preview,directory=str(directory),demo=args.demo)).serve_forever()
