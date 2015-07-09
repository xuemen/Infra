package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strings"
)

func welcome(w http.ResponseWriter, r *http.Request) {
	r.ParseForm() //解析参数，默认是不会解析的
	fmt.Println("method", r.Method)
	fmt.Println("path", r.URL.Path)

	for k, v := range r.Form {
		fmt.Println("key:", k)
		fmt.Println("val:", strings.Join(v, ""))
	}

	t, _ := template.ParseFiles("web/page/welcome.html")
	t.Execute(w, nil)
}

func serveFile(pattern string, filename string) {
	log.Printf("pattern:%s\tfilename:%s", pattern, filename)
	http.HandleFunc(pattern, func(w http.ResponseWriter, req *http.Request) {
		http.ServeFile(w, req, filename)
	})
}

func main() {
	CheckSignedLog("post/transfer.huangyg.1.yaml", "huangyg.pub")
	return
	indexinit()

	http.HandleFunc("/", welcome)
	http.HandleFunc("/data", receive)

	// static files
	http.HandleFunc("/web/", func(w http.ResponseWriter, req *http.Request) {
		http.ServeFile(w, req, req.URL.Path[1:])
	})
	http.HandleFunc("/log/", func(w http.ResponseWriter, req *http.Request) {
		http.ServeFile(w, req, req.URL.Path[1:])
	})
	http.HandleFunc("/cfg/", func(w http.ResponseWriter, req *http.Request) {
		http.ServeFile(w, req, req.URL.Path[1:])
	})
	serveFile("/favicon.ico", "./favicon.ico")

	err := http.ListenAndServe(":46372", nil) //设置监听的端口,infra
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}
