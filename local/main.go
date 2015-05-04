package main

import ()

func main() {
	postlog()
	//putcfg()
}

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}
