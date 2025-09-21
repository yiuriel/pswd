package repositories

import (
	"backend/pswd/internal/models"

	"github.com/jmoiron/sqlx"
)

type UserRepo struct {
	DB *sqlx.DB
}

func (r *UserRepo) CreateTable() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		email TEXT
	)`
	_, err := r.DB.Exec(schema)
	return err
}

func (r *UserRepo) Insert(user models.User) error {
	_, err := r.DB.NamedExec(`INSERT INTO users (name, email) VALUES (:name, :email)`, user)
	return err
}

func (r *UserRepo) GetAll() ([]models.User, error) {
	var users []models.User
	err := r.DB.Select(&users, "SELECT * FROM users")
	return users, err
}
