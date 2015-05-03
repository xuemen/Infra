package main

import (
	"bytes"
	"fmt"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
)

type logbody struct {
	COD    string
	Tag    string
	Author string
	Log    string
	Sig    string
}

type cfgbody struct {
	COD    string
	Tag    string
	Index  int
	Author string
	Cfg    string
	Sig    string
}

var Idx map[string]int

func indexinit() {
	indexbyte, _ := ioutil.ReadFile("index.yaml")
	yaml.Unmarshal(indexbyte, &Idx)
}

func receive(w http.ResponseWriter, r *http.Request) {
	r.ParseForm() //解析参数，默认是不会解析的
	fmt.Println("method", r.Method)
	fmt.Println("path", r.URL.Path)

	for k, v := range r.Form {
		fmt.Println("key:", k)
		fmt.Println("val:", strings.Join(v, ""))
	}

	if r.Method == "POST" {
		var buf bytes.Buffer
		var body logbody
		buf.ReadFrom(r.Body)
		yaml.Unmarshal(buf.Bytes(), &body)
		//log.Print(body)
		//log.Print(buf.String())
		_, ok := Idx[body.Tag]
		if !ok {
			Idx[body.Tag] = 0

			fmt.Fprintf(w, "log notify: create a new tag [%s].", body.Tag)
			log.Printf("log notify: create a new tag [%s].", body.Tag)
		}

		filename := fmt.Sprintf("log/%s.%s.%d.yaml", body.COD, body.Tag, Idx[body.Tag]+1)
		if Exist(filename) {
			fmt.Fprintf(w, "log fail: file [%s] exist.", filename)
			log.Printf("log fail: file [%s] exist.", filename)
		} else {
			ioutil.WriteFile(filename, buf.Bytes(), 0644)

			Idx[body.Tag] = Idx[body.Tag] + 1
			d, _ := yaml.Marshal(&Idx)
			ioutil.WriteFile("index.yaml", d, 0644)

			fmt.Fprintf(w, "log saved: file [%s].", filename)
			log.Printf("log saved: file [%s].", filename)
		}
	} else if r.Method == "PUT" {
		var buf bytes.Buffer
		var body cfgbody
		buf.ReadFrom(r.Body)
		yaml.Unmarshal(buf.Bytes(), &body)
		//log.Print(body)
		//log.Print(buf.String())

		filename := fmt.Sprintf("cfg/%s.%s.%d.yaml", body.COD, body.Tag, body.Index)
		if Exist(filename) {
			fmt.Fprintf(w, "cfg notify: file [%s] recover.", filename)
			log.Printf("cfg notify: file [%s] recover.", filename)
		} else {
			fmt.Fprintf(w, "cfg notify: create file [%s].", filename)
			log.Printf("cfg notify: create file [%s].", filename)
		}
		ioutil.WriteFile(filename, buf.Bytes(), 0644)
	}
}

func Exist(filename string) bool {
	_, err := os.Stat(filename)
	return err == nil || os.IsExist(err)
}
