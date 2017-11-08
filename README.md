### Bước 1

    $ npm install
  
### Bước 2: crawl

Sửa index.js
    
    crawl();
    // extract();
    
Đọc crawl.js để hiểu các bước nhỏ rồi chạy

    $ npm start

### Bước 3: extract feature

Sửa index.js

    // crawl();
    extract();
    
Đọc extract_features.js để hiểu các bước nhỏ rồi chạy

    $ npm start
    
### Chú ý

Mỗi bước nhỏ tại bước 2 & 3 chỉ được chạy đơn, không chạy nhiều bước nhỏ 1 lúc (ném vào then() thì được)