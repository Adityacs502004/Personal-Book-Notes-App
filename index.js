import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";


const app = express()
const port = 3000

const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "Capstone project 3 ",
    password : "200423",
    port : 5432,
});


db.connect();

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.get("/", async(req , res)=>{

    try {
        let books = await db.query("SELECT * FROM public.books");
        let book_data = books.rows;
        res.render("index.ejs" ,{
        total : book_data.length,
        book : book_data,
    });
    } catch (error) {
        console.log("Error getting books from db");
    }
    
});

app.get("/add_page" , (req  ,res)=>{
    res.render("add.ejs" , {
        button_text : "Add Book",
    })
});

app.post("/add_book" , async (req , res)=>{
    let blog_id = req.body.blog_id
    let action = req.body.action;
    let book_title = (req.body.book_title).trim();
    let book_author = (req.body.book_author).trim();

    if (action == "Add Book"){
            if(book_title && book_author){
            try {
                let search_book = await axios.get(`https://openlibrary.org/search.json?title=${book_title}&author=${book_author}`);
                let search_data = search_book.data;
                let cover_id = search_data.docs[0].cover_i;

                let insert_book = await db.query("INSERT INTO books (book_name , author_name , cover_id) VALUES ($1 , $2 , $3)" , [book_title , book_author , cover_id]);

                res.redirect("/");


            } catch (error) {
                console.log("Error getting book details");
                res.redirect("/");
            }
        }
        else{
            console.log("Book Title/Author missing.")
            res.redirect("/");
        };
    }
    else if (action == "Edit") {
        let edit_id = req.body.edit_id;

        let update = await db.query("UPDATE books SET book_name = $1 , author_name = $2 WHERE id = $3", [book_title , book_author , edit_id]);

        res.redirect("/");
    } else {
        console.log("Error adding/updating book!");
        res.redirect("/");
    }
    
    

});

app.post("/edit_title" , async(req,res)=>{
    let edit_notes_id = req.body.edit_notes_id;
    console.log(edit_notes_id);

    if(edit_notes_id){
        let book_details = await db.query("SELECT * FROM public.books WHERE id = $1" , [edit_notes_id]);
        let book_details_data = book_details.rows;

        res.render("add.ejs" , {
            book : book_details_data,
            button_text : "Edit"
        });
    }
    else{
        console.log("Cann't find book id");
    }
});


app.post("/notes" , async(req , res)=>{
    let add_notes_id = parseInt(req.body.add_notes_id);

    if(add_notes_id){
        try {
        let book = await db.query("SELECT * FROM public.books WHERE id = $1" , [add_notes_id]);
        let book_notes = await db.query("SELECT * FROM public.book_notes  WHERE id = $1" , [add_notes_id]);
        let book_notes_data = book_notes.rows[0] || null;
        let notes_book_data = book.rows[0] || null;
        console.log(notes_book_data);
        res.render("notes.ejs", {
            book_id : add_notes_id,
            book : notes_book_data,
            notes : book_notes_data,
        });
        } catch (error) {
            console.log("Error getting book details");
            console.log("Message: ", [error.message]);
            res.redirect("/");
        }
    }
    else{
        console.log("Didn't get notes id");
        res.redirect("/");
    }
 
});

app.post("/submit_notes" , async(req , res)=>{
    let book_id = req.body.book_id;
    let rating = req.body.rating;
    let notes = req.body.book_notes;

    try {
        let does_notes_exist = await db.query("SELECT * FROM public.book_notes WHERE id = $1" , [book_id]);

        let does_notes_exist_data = does_notes_exist.rowCount;

        if(does_notes_exist_data == 0){
            let add_notes = await db.query("INSERT INTO public.book_notes (id , notes , rating) VALUES ($1 , $2 , $3)" , [book_id , notes , rating]);
        }
        else{
            let update_notes = await db.query("UPDATE public.book_notes SET notes = $1 , rating = $2 WHERE id = $3" , [notes , rating , book_id]);
        }

        

        let join_table = await db.query("SELECT * FROM public.books INNER JOIN public.book_notes ON books.id = book_notes.id");

        res.redirect("/");
    } catch (error) {
        console.log("Error joining the database");
        res.redirect("/");
    }
    
});


app.post("/delete" , async(req ,res)=>{
    let delete_id = req.body.delete_id;

    try {
        let delete_notes = await db.query("DELETE FROM public.book_notes WHERE id =$1", [delete_id]);
        let delete_book = await db.query("DELETE FROM public.books WHERE id = $1", [delete_id]);
        res.redirect("/");
    } catch (error) {
        console.log("Error deleting data....")
        console.log(error.message);
        res.redirect("/");
    }
});

app.listen(port, () => console.log(`App listening on port ${port}!`));