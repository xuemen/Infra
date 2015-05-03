package main

import ()

func main() {
	sendlog()
}

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}
