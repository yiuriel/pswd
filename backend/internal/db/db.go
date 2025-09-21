package db

import (
	"log"

	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite" // import the sqlite driver
)

func Connect(dataSourceName string) *sqlx.DB {
	db, err := sqlx.Connect("sqlite", dataSourceName)
	if err != nil {
		log.Fatalln("failed to connect to database:", err)
	}
	return db
}
