# Expense-Tracker-App-JavaScript

## Liscence Notice
This Project is for mainly for job application, personal and non-commercial use only, any distribution and modification are not allowed.

## How to use
1. Install PostgreSQL
2. Create a database
3. Create two tables using the following SQL
    ```
    CREATE TABLE expensetables
    (
        id serial NOT NULL,
        name character varying(50) NOT NULL,
        deleted boolean DEFAULT false,
        PRIMARY KEY (id)
    );
    
    CREATE TABLE expenseitems
    (
        id serial NOT NULL,
        date date,
        category character varying(50),
        shop character varying(50),
        item character varying(50),
        quantity integer,
        price numeric(10, 2),
        deleted boolean DEFAULT false,
        table_id integer,
        PRIMARY KEY (id),
        FOREIGN KEY (table_id) REFERENCES expensetables(id)
    );
4. Create a .env file inside /backend
5. Add the following in the .env file
    ```
    Host = localhost
    User = postgres
    Port = {PostgreSQL port number}
    Password = {PostgreSQL password}
    Database = {database name stated in 2}
6. navigate to expense_tracker_js/backend in cmd, type the following to run the server
     ```
     node server.js
7. Enter "http://127.0.0.1:3000/frontend/html/expenseTables.html" in web browser to use the web application

## Screenshot
<img width="1280" height="720" alt="expenseTable" src="https://github.com/user-attachments/assets/6491a63a-1c32-4c20-8caf-c076fd90b905" />
<img width="1280" height="720" alt="expenseItem" src="https://github.com/user-attachments/assets/da47e20a-7897-47b3-8c0b-64f52bff633d" />

