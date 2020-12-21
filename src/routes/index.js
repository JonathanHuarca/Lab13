const { Router} = require('express');
const router = Router();
const fs   = require('fs-extra');
const path = require('path');
const AWS = require('aws-sdk');
var dbConn  = require('../database');


AWS.config.update({
    accessKeyId:process.env.ID,
    secretAccessKey:process.env.SECRET,
    region: 'sa-east-1' 
});




//-----------------------CRUD -------------------------------------


router.get('/', function(req, res, next) {

  dbConn.query('SELECT * FROM contactos ORDER BY id desc',function(err,photos)     {
      if(err) {
          req.flash('error', err);
          // render to views/books/index.ejs
          res.render('images',{data:''});   
      } else {
          // render to views/books/index.ejs
          res.render('images',{photos});
      }
  });
});


router.get('/images/add', function(req, res, next) {

  dbConn.query('SELECT * FROM contactos ORDER BY id desc',function(err,photos)     {
      if(err) {
          req.flash('error', err);
          // render to views/books/index.ejs
          res.render('image_form',{data:''});   
      } else {
          // render to views/books/index.ejs
          res.render('image_form',{photos});
      }
  });
});


router.post('/images/add', async (req, res) => {


    const {nombre, apellido, email, celular} = req.body;

    var s3 = new AWS.S3();
    
    if(!req.file){

      var form_data = {
        nombre: nombre,
        apellido: apellido,
        email:email,
        celular:celular,
     }
  
      dbConn.query('INSERT INTO contactos SET ?', form_data, function(err, result) { })
      res.redirect('/images/add');

    }else{

      var filePath = req.file.path;

      var params = {
        Bucket : `${process.env.BUCKET_NAME}`,
        Body   : fs.createReadStream(filePath),
        Key    : "imagenes/" + Date.now() + "_" + path.basename(filePath),
        ACL    : 'public-read'
      };
    
        
     s3.upload(params,async function (err, data) {
        //en caso de error
        if (err) {
          console.log("Error", err);
        }
      
        // el archivo se ha subido correctamente
        if (data) {

          console.log("Uploaded in:", data.Location);

          var form_data = {
            nombre: nombre,
            apellido: apellido,
            email:email,
            celular:celular,
            imageURL:data.Location,
         }
        // insert query
          dbConn.query('INSERT INTO contactos SET ?', form_data, function(err, result) { })
          await fs.unlink(req.file.path);
          res.redirect('/images/add');
        }

      });

    }

   

});


router.get('/images/delete/:id', async (req, res) => {
    

    let id = req.params.id;
    dbConn.query('SELECT * FROM contactos WHERE id = ' + id, function(err, result) {
      
      var s3 = new AWS.S3();

      if(!result.imageURL){

        dbConn.query('DELETE FROM contactos WHERE id = ' + id, function(err, result) {})
        res.redirect('/images/add');

      }else{


        let url = result.imageURL
        let length = url.length
        let termino = "imagenes/";        
        let posicion = url.indexOf(termino);
        let key_file = url.substring(posicion,length);
                
        const deleteFile = {
            Bucket:`${process.env.BUCKET_NAME}`,
            Key: key_file
        };
        
        s3.deleteObject( deleteFile ).promise()
        dbConn.query('DELETE FROM contactos WHERE id = ' + id, function(err, result) {})
        res.redirect('/images/add');
      }

    })
   
})

router.post('/images/update/:id', async (req, res) => {
    const {nombre, apellido, email, celular} = req.body;

    const id = req.params.id;

    if(!req.file){

      var form_data = {
        nombre: nombre,
        apellido: apellido,
        email:email,
        celular:celular
     }
      
      dbConn.query('UPDATE contactos SET ? WHERE id = ' + id, form_data, function(err, result) {
        //if(err) throw err
        if (err) {
            // set flash message
        } else {
           // req.flash('success', 'Contact successfully updated');
            res.redirect('/images/add');
        }
    })      
    }else{

        //Eliminamos el archivo antiguo de S3
        var s3 = new AWS.S3();
        dbConn.query('SELECT * FROM contactos WHERE id = ' + id, function(err, photos) {

          var photo = photos[0]
          let url = photo.imageURL
          let length = url.length
          let termino = "imagenes/";        
          let posicion = url.indexOf(termino);
          let key_file = url.substring(posicion,length);
                  
          const deleteFile = {
              Bucket:`${process.env.BUCKET_NAME}`,
              Key: key_file
          };
          s3.deleteObject( deleteFile ).promise()
  
         //Realizamos la subida del nuevo archivo a S3
  
          var filePath = req.file.path;
          var params = {
      
              Bucket : `${process.env.BUCKET_NAME}`,
              Body   : fs.createReadStream(filePath),
              Key    : "imagenes/" + Date.now() + "_" + path.basename(filePath),
              ACL    : 'public-read'
      
            };
              
          s3.upload(params,async function (err, data) {
              //en caso de error
              if (err) {
                console.log("Error", err);
              }
            
              // el archivo se ha subido correctamente
              if (data) {
                console.log("Uploaded in:", data.Location);
                await fs.unlink(req.file.path);
             
                var form_data = {
                  nombre: nombre,
                  apellido: apellido,
                  email:email,
                  celular:celular,
                  imageURL:data.Location,
               }
               
                dbConn.query('UPDATE contactos SET ? WHERE id = ' + id, form_data, function(err, result) {
                  //if(err) throw err
                  if (err) {
                      // set flash message
                  } else {
                     // req.flash('success', 'Contact successfully updated');
                      res.redirect('/images/add');
                  }
                })    
            
              }
            });
        })
    }
});


router.get('/images/update/file/:id', async (req, res) => {

    const id = req.params.id;
    dbConn.query('SELECT * FROM contactos WHERE id = ' + id, function(err,photo)     {
      if(err) {
          // render to views/books/index.ejs
          res.render('image_update', {photo})   
      } else {
         var photos = photo[0]
          // render to views/books/index.ejs
          res.render('image_update', {photos})
      }
  });
});

router.post('/images/buscar', async (req, res) => {

    const apellido = req.body.apellido;
    dbConn.query(`SELECT * FROM contactos WHERE apellido = '${apellido}'`, function(err,photos) {
      if(err) {
          res.render('image_form', {photos})   
      } else {
          res.render('image_form', {photos})
      }
  });
});

module.exports = router;
