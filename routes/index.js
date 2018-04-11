var express = require('express');
var router = express.Router();
var cv = require('opencv');
var _ = require('lodash');

/**
 * Get /
 */
router.get('/', (req, res) => {
  res.render('index', {
    blur: req.app.locals.blur,
    //balance: req.app.locals.balance,
    srcImageUrl: req.app.locals.srcImageUrl,
    dstImageUrl: req.app.locals.dstImageUrl
  });
});

/**
 * Get /
 */
router.get('/convert', (req, res) => {
  res.render('index', {
    blur: req.app.locals.blur,
    // balance: req.app.locals.balance,
    srcImageUrl: req.app.locals.srcImageUrl,
    dstImageUrl: req.app.locals.dstImageUrl
  });
});

/**
 * Post /upload
 */
router.post('/upload', (req, res) => {
  var image = req.files.file;
  var id = req.params.id;
  var path = 'public/uploads/' + req.files.file.name;

  image.mv(path, function (err) {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      
      req.app.locals.srcImageName = req.files.file.name;
      res.sendStatus(200);
  });
});

/**
 * Post /convert
 */
router.post('/convert', (req, res) => {
  var blur = req.body.blur;
  // var balance = req.body.balance;
  req.app.locals.blur = req.body.blur;
  // req.app.locals.balance = req.body.balance;

  console.log('blur:', blur);
  // console.log('balance:', balance);

  var srcImageUrl = "public/uploads/" + req.app.locals.srcImageName;
  var dstImageUrl = "public/converts/" + 
                    // balance + "_" + 
                    blur + "_" + 
                    req.app.locals.srcImageName;
  req.app.locals.srcImageUrl = srcImageUrl;
  req.app.locals.dstImageUrl = dstImageUrl;

  console.log('srcImageUrl:', srcImageUrl);
  console.log('dstImageUrl:', dstImageUrl);

  cv.readImage(srcImageUrl, function (err, im) {
    if (err) {
      console.error(err);
      //req.flash("danger", "Can't read source image.");
      return res.render('index', {
        blur: blur,
        // balance: balance,
        srcImageUrl: srcImageUrl,
        dstImageUrl: dstImageUrl
      });
    }

    const width = im.width();
    const height = im.height();

    if (width < 1 || height < 1) {
      console.log('Image has no size');
      //req.flash("danger", "Source image has no size");
      return res.render('index', {
        blur: blur,
        // balance: balance,
        srcImageUrl: srcImageUrl,
        dstImageUrl: dstImageUrl
      });
    }

    var src = im.clone();    
    src.gaussianBlur([3, 3]);

    var procImg = src.clone();
    procImg.cvtColor("CV_BGR2YCrCb");

    procImg.inRange([80, 120, 100], [255, 175, 135]);
    procImg.dilate(0);

    var face = src.clone();
    var face_proc = procImg.clone();
    face_proc.cvtColor("CV_GRAY2BGR");
    for(y = 0; y < face_proc.rows; y++)
    {
      for(x = 0; x < face_proc.cols; x++)
      {
        var colour = face_proc.at([x, y]);
        if(colour.val[0] == 0 && colour.val[1] == 0 && colour.val[2] == 0)
          face.at([x, y]) = colour;
      }
    }

    procImg.threshold(0, 255);
    var nonFace = src.clone();
    var nonface_proc = procImg.clone();
    nonface_proc.cvtColor("CV_GRAY2BGR");
    var pixCnt = 0, blueColor = 0;
    for(y = 0; y < nonface_proc.rows; y++)
    {
      for(x = 0; x < nonface_proc.cols; x++)
      {
        var colour = nonface_proc.at([x, y]);
        blueColor += src.at([x, y])[0];
        if(colour.val[0] == 0 && colour.val[1] == 0 && colour.val[2] == 0)
          nonFace.at([x, y]) = colour;
        pixCnt++;
      }
    }

    var color = blueColor/pixCnt;

    for ( i = 1; i < blur; i = i + 2 )
    {
      var delay = i % 2;
      if(delay == 1)
      {
        if(i < 7) {
          nonFace.bilateralFilter (i, i*2, i/2 );
        }

        face.bilateralFilter (i, i*2, i/2 );
      }
    }

    var dst = src.clone();
    dst.addWeighted(nonFace, 1, face, 1, 0);

    //var filter = cv.Mat(src.size(), src.type());
    if (color > 100) {
      // filter = [255, 255, 0];
      cv.readImage(`public/images/Warm.png`, function (err, fImage) {
        if (err) {
          console.log("Can't balancing.");
          req.app.locals.errors = "Source image has no size";
          return res.render('index', {
            blur: blur,
            // balance: balance,
            srcImageUrl: srcImageUrl,
            dstImageUrl: dstImageUrl
          });
        }

        fImage.resize(width, height);
        dst.addWeighted(im, 1, fImage, 0.1, 0);
      });
    }
    else if (color < 50) {
      // filter = [255, 0, 0];
      cv.readImage(`public/images/Cool.png`, function (err, fImage) {
        if (err) {
          console.log("Can't balancing.");
          req.app.locals.errors = "Source image has no size";
          return res.render('index', {
            blur: blur,
            // balance: balance,
            srcImageUrl: srcImageUrl,
            dstImageUrl: dstImageUrl
          });
        }

        fImage.resize(width, height);
        dst.addWeighted(im, 1, fImage, 0.1, 0);
      });
    } else {
      filter = dst.clone();
      dst.addWeighted(im, 1, filter, 0.1, 0);
    }

    // var result = dst.clone()
    // result.addWeighted(dst, 0.9, filter, 0.1, 0);
    // dst.imshow("result");
    // cv.waitKey(0);
  
    if (dst) {
      dst.save(dstImageUrl);
    } else {
      console.log("Can't save dst image.");
    }
  });

  res.render('index', {
    blur: blur,
    // balance: balance,
    srcImageUrl: srcImageUrl,
    dstImageUrl: dstImageUrl
  });

});

/*
router.post('/convert', (req, res) => {
  var blur = req.body.blur;
  var balance = req.body.balance;

  console.log('blur', blur);
  console.log('balance', balance);

  var srcImageUrl = "public/uploads/" + req.app.locals.srcImageName;
  var dstImageUrl = "public/converts/" + balance + "_" + blur + "_" + req.app.locals.srcImageName;
  console.log('srcImageUrl', srcImageUrl);
  console.log('dstImageUrl', dstImageUrl);

  cv.readImage(srcImageUrl, function (err, im) {
    if (err) {
      console.error(err);
      req.app.locals.errors = "Can't read source image.";
      res.render('index', {
        srcImageUrl: '',
        dstImageUrl: ''
      });
    }

    const width = im.width();
    const height = im.height();

    if (width < 1 || height < 1) {
      console.log('Image has no size');
      req.app.locals.errors = "Source image has no size";
      res.render('index', {
        srcImageUrl: '',
        dstImageUrl: ''
      });
    }

    for (i = 1; i < blur; i = i + 2) {
      im.bilateralFilter(i, i * 2, i / 2);
    }

    var dst = im.clone();

    if (balance !== "Normal") {
      cv.readImage(`public/images/${balance}.png`, function (err, filter) {
        if (err) {
          console.log("Can't balancing.");
          req.app.locals.errors = "Source image has no size";
          res.render('index', {
            srcImageUrl: '',
            dstImageUrl: ''
          });
        }

        filter.resize(width, height);
        dst.addWeighted(im, 1, filter, 0.1, 0);
      });
    }

    if (dst)
      dst.save(dstImageUrl);
  });

  res.render('index', {
    srcImageUrl: srcImageUrl,
    dstImageUrl: dstImageUrl
  });

});
*/

// Exports
module.exports = router;
