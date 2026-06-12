-- Groom to Be cakes — 20 products for Special Milestones occasion
-- Images already uploaded to Cloudinary
-- Category: Occasion Cakes = cmq2aide00001pvoou1f9tqu7
-- Occasion: special-milestones, Recipient: groom-to-be

SET @cat = 'cmq2aide00001pvoou1f9tqu7';
SET @occ = '["special-milestones"]';
SET @forwho = '["groom-to-be"]';
SET @flavs = '["Chocochips","Hazelnut","Nutella","Belgian Chocolate","Almond Truffle","Truffle Dutch","Butterscotch","Salted Caramel","Red Velvet","Pineapple","Blueberry","Strawberry","Kesar Pista","Rose"]';
SET @fp = '[{"name":"Chocochips","price500g":550},{"name":"Hazelnut","price500g":600},{"name":"Nutella","price500g":600},{"name":"Belgian Chocolate","price500g":650},{"name":"Almond Truffle","price500g":650},{"name":"Truffle Dutch","price500g":600},{"name":"Butterscotch","price500g":550},{"name":"Salted Caramel","price500g":650},{"name":"Red Velvet","price500g":600},{"name":"Pineapple","price500g":450},{"name":"Blueberry","price500g":450},{"name":"Strawberry","price500g":450},{"name":"Kesar Pista","price500g":650},{"name":"Rose","price500g":550}]';
SET @now = NOW(3);

-- 1. Game Over Final Countdown Cake (single-fondant-heavy: 1-4kg, design=399)
-- Price formula: 450*weightKg*2 + designCharge. 1kg = 450*1*2+399 = 1299
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_01','Game Over Final Countdown Cake','game-over-final-countdown-cake','Playful bachelor party cake with Game Over theme, couple toppers, fresh roses and pearls','Send off the groom in style with this cheeky Game Over themed cake. Decorated with a bold retro-style Game Over banner, adorable couple cutout toppers, scattered pearl accents and gorgeous fresh pink and yellow roses, this cake is the ultimate bachelor party centerpiece. The smooth white buttercream finish adds elegance to the playful theme, making it a crowd favourite at any groom-to-be celebration. Ideal for stag nights, bachelor bashes and pre-wedding parties.',1299,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268347/blissbakery/products/eotom1uivtiisnj4kvlh.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',399,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_01_v1','1 Kg',1299,1,0,'grm_01','Serves 8-10'),
('grm_01_v2','1.5 Kg',1749,1,1,'grm_01','Serves 12-15'),
('grm_01_v3','2 Kg',2199,1,2,'grm_01','Serves 18-20'),
('grm_01_v4','2.5 Kg',2649,1,3,'grm_01','Serves 22-25'),
('grm_01_v5','3 Kg',3099,1,4,'grm_01','Serves 28-30'),
('grm_01_v6','3.5 Kg',3549,1,5,'grm_01','Serves 32-35'),
('grm_01_v7','4 Kg',3999,1,6,'grm_01','Serves 38-40');

-- 2. Marble Tuxedo Suit Cake (single-tall: 1-4kg, design=499)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_02','Marble Tuxedo Suit Cake','marble-tuxedo-suit-cake','Sophisticated grey marble tall cake with hand-painted tuxedo, gold and black spheres','A strikingly sophisticated groom-to-be cake featuring a tall grey marble finish with a beautifully hand-painted black tuxedo suit holding a champagne glass. Accented with luxurious gold and black chocolate spheres and a sleek gold candle, this cake screams refined elegance. Perfect for classy bachelor parties, engagement celebrations, or groom shower events where you want a premium centrepiece that matches the groom''s dapper style.',1399,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268348/blissbakery/products/yltx90u9vtjvafhpbwkk.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',499,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_02_v1','1 Kg',1399,1,0,'grm_02','Serves 8-10'),
('grm_02_v2','1.5 Kg',1849,1,1,'grm_02','Serves 12-15'),
('grm_02_v3','2 Kg',2299,1,2,'grm_02','Serves 18-20'),
('grm_02_v4','2.5 Kg',2749,1,3,'grm_02','Serves 22-25'),
('grm_02_v5','3 Kg',3199,1,4,'grm_02','Serves 28-30'),
('grm_02_v6','3.5 Kg',3649,1,5,'grm_02','Serves 32-35'),
('grm_02_v7','4 Kg',4099,1,6,'grm_02','Serves 38-40');

-- 3. Bride & Groom Fondant Couple Cake (single-fondant-heavy: 1-4kg, design=449)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_03','Bride & Groom Fondant Couple Cake','bride-groom-fondant-couple-cake','White textured cake with adorable fondant bride and groom figurines and chain detail','This delightful groom-to-be cake features beautifully handcrafted fondant figurines of a bride and groom in a fun, playful pose. The textured white buttercream base, cute red heart accent and detailed fondant chain add character and charm to every slice of this celebration. A sweet and memorable choice for bachelor parties, couples'' pre-wedding gatherings and groom shower celebrations that deserve a personal touch.',1349,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268349/blissbakery/products/zmn3xubgm5jjer216vzr.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',449,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_03_v1','1 Kg',1349,1,0,'grm_03','Serves 8-10'),
('grm_03_v2','1.5 Kg',1799,1,1,'grm_03','Serves 12-15'),
('grm_03_v3','2 Kg',2249,1,2,'grm_03','Serves 18-20'),
('grm_03_v4','2.5 Kg',2699,1,3,'grm_03','Serves 22-25'),
('grm_03_v5','3 Kg',3149,1,4,'grm_03','Serves 28-30'),
('grm_03_v6','3.5 Kg',3599,1,5,'grm_03','Serves 32-35'),
('grm_03_v7','4 Kg',4049,1,6,'grm_03','Serves 38-40');

-- 4. Groom To Be Gold Star Celebration Cake (single-not-tall: 0.5-3kg, design=249)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_04','Groom To Be Gold Star Celebration Cake','groom-to-be-gold-star-celebration-cake','White cake with golden Groom to Be text, Game Over plaque, couple cutout and glitter stars','Celebrate the groom''s last days of freedom with this charming white cake featuring golden Groom to Be lettering, a playful Game Over plaque in gold, adorable couple caricature cutout and sparkling glitter star toppers. The ridged buttercream texture, silver diamond accents and scattered pearls give this cake a festive, party-ready vibe. A wonderful choice for bachelor parties and pre-wedding celebrations.',699,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268349/blissbakery/products/ajr7awdaqlplc3mujzae.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',249,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_04_v1','0.5 Kg',699,1,0,'grm_04','Serves 4-6'),
('grm_04_v2','1 Kg',1149,1,1,'grm_04','Serves 8-10'),
('grm_04_v3','1.5 Kg',1599,1,2,'grm_04','Serves 12-15'),
('grm_04_v4','2 Kg',2049,1,3,'grm_04','Serves 18-20'),
('grm_04_v5','2.5 Kg',2499,1,4,'grm_04','Serves 22-25'),
('grm_04_v6','3 Kg',2949,1,5,'grm_04','Serves 28-30');

-- 5. Game Over Silhouette Rose Cake (single-not-tall: 0.5-3kg, design=199)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_05','Game Over Silhouette Rose Cake','game-over-silhouette-rose-cake','Minimalist white cake with Game Over silhouette topper and elegant white roses','A beautifully understated groom-to-be cake featuring a swirled white buttercream finish, a striking black and gold Game Over silhouette topper showing a bride dragging the groom from his gaming chair, and a cluster of pristine white roses with fresh greenery. The contrast of the fun topper against the elegant cake design makes this a versatile choice for both casual stag parties and sophisticated pre-wedding celebrations.',649,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268350/blissbakery/products/ofnu9ueom6tmj8u3melq.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',199,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_05_v1','0.5 Kg',649,1,0,'grm_05','Serves 4-6'),
('grm_05_v2','1 Kg',1099,1,1,'grm_05','Serves 8-10'),
('grm_05_v3','1.5 Kg',1549,1,2,'grm_05','Serves 12-15'),
('grm_05_v4','2 Kg',1999,1,3,'grm_05','Serves 18-20'),
('grm_05_v5','2.5 Kg',2449,1,4,'grm_05','Serves 22-25'),
('grm_05_v6','3 Kg',2899,1,5,'grm_05','Serves 28-30');

-- 6. Royal Navy Blue Tuxedo Cake (single-tall: 1-4kg, design=549)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_06','Royal Navy Blue Tuxedo Cake','royal-navy-blue-tuxedo-cake','Stunning tall navy blue fondant tuxedo cake with gold bow tie, buttons and spheres','This showstopping tall cake is crafted entirely in rich navy blue fondant, designed to look like a perfectly tailored tuxedo with a crisp white shirt, gold buttons and a magnificent oversized gold fondant bow tie. Surrounded by luxurious gold chocolate spheres and delicate tulle at the base, this is one of our most premium groom-to-be designs. Ideal for upscale bachelor celebrations, engagement dinners or any pre-wedding event that calls for true elegance.',1449,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268351/blissbakery/products/xpxjr8w5hybvuoyvd4pz.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',549,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_06_v1','1 Kg',1449,1,0,'grm_06','Serves 8-10'),
('grm_06_v2','1.5 Kg',1899,1,1,'grm_06','Serves 12-15'),
('grm_06_v3','2 Kg',2349,1,2,'grm_06','Serves 18-20'),
('grm_06_v4','2.5 Kg',2799,1,3,'grm_06','Serves 22-25'),
('grm_06_v5','3 Kg',3249,1,4,'grm_06','Serves 28-30'),
('grm_06_v6','3.5 Kg',3699,1,5,'grm_06','Serves 32-35'),
('grm_06_v7','4 Kg',4149,1,6,'grm_06','Serves 38-40');

-- 7. Gentleman Cigar & Bow Tie Cake (single-fondant-heavy: 1-4kg, design=449)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_07','Gentleman Cigar & Bow Tie Cake','gentleman-cigar-bow-tie-cake','White fondant cake with red bow tie, cigar, mustache topper and Groom to Be script','Raise a toast to the dapper groom with this fun and stylish cake. Featuring a smooth white fondant base adorned with a bold red fondant bow tie, black buttons, a realistic fondant cigar, curly mustache topper and a gorgeous gold glitter Groom to Be cake topper, this design captures the spirit of a gentleman''s celebration. A crowd-pleasing choice for bachelor parties, groom showers and pre-wedding festivities.',1349,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268351/blissbakery/products/tnqtibikkayedcnnhjam.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',449,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_07_v1','1 Kg',1349,1,0,'grm_07','Serves 8-10'),
('grm_07_v2','1.5 Kg',1799,1,1,'grm_07','Serves 12-15'),
('grm_07_v3','2 Kg',2249,1,2,'grm_07','Serves 18-20'),
('grm_07_v4','2.5 Kg',2699,1,3,'grm_07','Serves 22-25'),
('grm_07_v5','3 Kg',3149,1,4,'grm_07','Serves 28-30'),
('grm_07_v6','3.5 Kg',3599,1,5,'grm_07','Serves 32-35'),
('grm_07_v7','4 Kg',4049,1,6,'grm_07','Serves 38-40');

-- 8. Classic Groom To Be Tuxedo Cake (single-not-tall: 0.5-3kg, design=249)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_08','Classic Groom To Be Tuxedo Cake','classic-groom-to-be-tuxedo-cake','Elegant cream textured cake with fondant tuxedo front, black bow tie and mustache topper','Simple, clean and undeniably stylish, this groom-to-be cake features a textured cream buttercream finish with a neatly crafted black and white fondant tuxedo front complete with bow tie and buttons. Topped with a Groom to Be mustache topper, this design is a timeless choice for any bachelor celebration. Its understated elegance makes it suitable for both intimate gatherings and larger pre-wedding parties.',699,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268352/blissbakery/products/et8r28l8v2fpovqxls1g.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',249,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_08_v1','0.5 Kg',699,1,0,'grm_08','Serves 4-6'),
('grm_08_v2','1 Kg',1149,1,1,'grm_08','Serves 8-10'),
('grm_08_v3','1.5 Kg',1599,1,2,'grm_08','Serves 12-15'),
('grm_08_v4','2 Kg',2049,1,3,'grm_08','Serves 18-20'),
('grm_08_v5','2.5 Kg',2499,1,4,'grm_08','Serves 22-25'),
('grm_08_v6','3 Kg',2949,1,5,'grm_08','Serves 28-30');

-- 9. Ivory Gold Tuxedo Boutonniere Cake (single-tall: 1-4kg, design=549)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_09','Ivory Gold Tuxedo Boutonniere Cake','ivory-gold-tuxedo-boutonniere-cake','Premium tall ivory fondant cake with blush lapels, gold bow tie, buttons and boutonniere','A truly exquisite groom-to-be cake that doubles as a work of art. This tall cake is wrapped in smooth ivory fondant with blush pink tuxedo lapels, three gold buttons, a stunning oversized gold fondant bow tie and a delicate fondant boutonniere flower. Finished with a gold ribbon around the base, every detail speaks luxury and refinement. Perfect for upscale bachelor dinners, engagement celebrations and groom showers.',1449,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268353/blissbakery/products/iciqjyyghjfuou9xypdm.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',549,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_09_v1','1 Kg',1449,1,0,'grm_09','Serves 8-10'),
('grm_09_v2','1.5 Kg',1899,1,1,'grm_09','Serves 12-15'),
('grm_09_v3','2 Kg',2349,1,2,'grm_09','Serves 18-20'),
('grm_09_v4','2.5 Kg',2799,1,3,'grm_09','Serves 22-25'),
('grm_09_v5','3 Kg',3249,1,4,'grm_09','Serves 28-30'),
('grm_09_v6','3.5 Kg',3699,1,5,'grm_09','Serves 32-35'),
('grm_09_v7','4 Kg',4149,1,6,'grm_09','Serves 38-40');

-- 10. Groom To Be Couple Leash Cake (single-tall: 1-4kg, design=399)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_10','Groom To Be Couple Leash Cake','groom-to-be-couple-leash-cake','Tall cream cake with illustrated couple, gold pearls, black ribbon and Groom to Be topper','A fun and lively groom-to-be tall cake with a smooth cream base decorated with a charming illustrated couple where the bride leads the groom on a playful leash. Gold pearl sprinkles cascade around the top, with a crisp black ribbon and bow at the base and an elegant black Groom to Be script topper. This design balances humour with style, making it perfect for fun-loving bachelor parties and pre-wedding celebrations.',1299,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268354/blissbakery/products/phwxvf0attbwzz1dpn0z.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',399,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_10_v1','1 Kg',1299,1,0,'grm_10','Serves 8-10'),
('grm_10_v2','1.5 Kg',1749,1,1,'grm_10','Serves 12-15'),
('grm_10_v3','2 Kg',2199,1,2,'grm_10','Serves 18-20'),
('grm_10_v4','2.5 Kg',2649,1,3,'grm_10','Serves 22-25'),
('grm_10_v5','3 Kg',3099,1,4,'grm_10','Serves 28-30'),
('grm_10_v6','3.5 Kg',3549,1,5,'grm_10','Serves 32-35'),
('grm_10_v7','4 Kg',3999,1,6,'grm_10','Serves 38-40');

-- 11. Groom To Be Rings Tuxedo Cake (single-not-tall: 0.5-3kg, design=299)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_11','Groom To Be Rings Tuxedo Cake','groom-to-be-rings-tuxedo-cake','Smooth white cake with tuxedo front, silver pearls, gold base and wedding rings topper','A neat and charming groom-to-be cake featuring a smooth white buttercream finish dotted with silver pearl accents, a cleanly crafted black and white fondant tuxedo front with bow tie, and a fun Groom to Be topper with interlocking wedding rings. The gold base board and black ribbon add a touch of sophistication. An excellent choice for intimate bachelor parties and elegant pre-wedding celebrations.',749,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268354/blissbakery/products/brnjsrt4xouuixrc21rm.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',299,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_11_v1','0.5 Kg',749,1,0,'grm_11','Serves 4-6'),
('grm_11_v2','1 Kg',1199,1,1,'grm_11','Serves 8-10'),
('grm_11_v3','1.5 Kg',1649,1,2,'grm_11','Serves 12-15'),
('grm_11_v4','2 Kg',2099,1,3,'grm_11','Serves 18-20'),
('grm_11_v5','2.5 Kg',2549,1,4,'grm_11','Serves 22-25'),
('grm_11_v6','3 Kg',2999,1,5,'grm_11','Serves 28-30');

-- 12. Indian Baraat Sherwani Groom Cake (single-tall: 1-4kg, design=449)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_12','Indian Baraat Sherwani Groom Cake','indian-baraat-sherwani-groom-cake','Tall cream cake with Indian groom in sherwani, dhol, shehnai, umbrella and rose toppers','Celebrate the Indian groom in grand baraat style with this stunning tall cake. Decorated with a beautifully illustrated groom in a black sherwani, traditional baraat elements including a decorated umbrella, shehnai trumpets, dhol drum and jootis, plus fresh white roses and gold leaf accents. Finished with a Groom to Be bow tie topper and golden pearl sprinkles, this cake is perfect for Indian wedding celebrations, haldi ceremonies and desi bachelor parties.',1349,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268355/blissbakery/products/mkyiiszilnxxhxksjzln.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',449,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_12_v1','1 Kg',1349,1,0,'grm_12','Serves 8-10'),
('grm_12_v2','1.5 Kg',1799,1,1,'grm_12','Serves 12-15'),
('grm_12_v3','2 Kg',2249,1,2,'grm_12','Serves 18-20'),
('grm_12_v4','2.5 Kg',2699,1,3,'grm_12','Serves 22-25'),
('grm_12_v5','3 Kg',3149,1,4,'grm_12','Serves 28-30'),
('grm_12_v6','3.5 Kg',3599,1,5,'grm_12','Serves 32-35'),
('grm_12_v7','4 Kg',4049,1,6,'grm_12','Serves 38-40');

-- 13. Groom To Be Beer Toast Couple Cake (single-tall: 1-4kg, design=399)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_13','Groom To Be Beer Toast Couple Cake','groom-to-be-beer-toast-couple-cake','Tall cream cake with bride-groom illustration, gold sprinkles, black ribbon and beer topper','Cheers to the groom with this fun and festive tall cake! Featuring a playful illustrated bride tying up the groom with a golden rope, cascading gold sprinkles, a sleek black satin ribbon with bow, and a unique Groom to Be topper with a beer mug silhouette. This lighthearted design is the life of the party and perfect for bachelor celebrations, boys'' nights and pre-wedding gatherings with a fun twist.',1299,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268356/blissbakery/products/akbpxjzczfi9toux6kpi.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',399,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_13_v1','1 Kg',1299,1,0,'grm_13','Serves 8-10'),
('grm_13_v2','1.5 Kg',1749,1,1,'grm_13','Serves 12-15'),
('grm_13_v3','2 Kg',2199,1,2,'grm_13','Serves 18-20'),
('grm_13_v4','2.5 Kg',2649,1,3,'grm_13','Serves 22-25'),
('grm_13_v5','3 Kg',3099,1,4,'grm_13','Serves 28-30'),
('grm_13_v6','3.5 Kg',3549,1,5,'grm_13','Serves 32-35'),
('grm_13_v7','4 Kg',3999,1,6,'grm_13','Serves 38-40');

-- 14. Gold Splatter Tuxedo Sphere Cake (single-tall: 1-4kg, design=399)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_14','Gold Splatter Tuxedo Sphere Cake','gold-splatter-tuxedo-sphere-cake','Textured white cake with gold splatter, tuxedo front, black and gold chocolate spheres','A modern and trendy groom-to-be cake combining a textured white buttercream base with gold paint splatters, a sharp black and white fondant tuxedo front with bow tie, and clusters of black and gold chocolate spheres. The scattered white pearl accents complete the look. This contemporary design is perfect for stylish bachelor parties, modern groom showers and celebrations that call for something bold and eye-catching.',1299,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268357/blissbakery/products/vghpwxpxsuyu7fumr4n1.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',399,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_14_v1','1 Kg',1299,1,0,'grm_14','Serves 8-10'),
('grm_14_v2','1.5 Kg',1749,1,1,'grm_14','Serves 12-15'),
('grm_14_v3','2 Kg',2199,1,2,'grm_14','Serves 18-20'),
('grm_14_v4','2.5 Kg',2649,1,3,'grm_14','Serves 22-25'),
('grm_14_v5','3 Kg',3099,1,4,'grm_14','Serves 28-30'),
('grm_14_v6','3.5 Kg',3549,1,5,'grm_14','Serves 32-35'),
('grm_14_v7','4 Kg',3999,1,6,'grm_14','Serves 38-40');

-- 15. Two Tier Tuxedo Groom Cake (two-tier: 1.5-6kg, design=699)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_15','Two Tier Tuxedo Groom Cake','two-tier-tuxedo-groom-cake','Grand 2-tier black and white tuxedo cake with bow tie, buttons, roses and top hat topper','Make a grand statement with this magnificent two-tier groom-to-be cake. Both tiers are dressed in smooth white fondant with sharp black tuxedo details including a bow tie, buttons, lapels and waistcoat accents. Fresh white roses with baby''s breath adorn the side and a stylish Groom to Be top hat topper crowns the creation. This premium design is ideal for engagement parties, large bachelor celebrations and luxury pre-wedding events.',2049,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268358/blissbakery/products/aib4wcxqivdduksu9eut.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',699,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_15_v1','1.5 Kg',2049,1,0,'grm_15','Serves 12-15'),
('grm_15_v2','2 Kg',2499,1,1,'grm_15','Serves 18-20'),
('grm_15_v3','2.5 Kg',2949,1,2,'grm_15','Serves 22-25'),
('grm_15_v4','3 Kg',3399,1,3,'grm_15','Serves 28-30'),
('grm_15_v5','3.5 Kg',3849,1,4,'grm_15','Serves 32-35'),
('grm_15_v6','4 Kg',4299,1,5,'grm_15','Serves 38-40'),
('grm_15_v7','5 Kg',5199,1,6,'grm_15','Serves 48-50'),
('grm_15_v8','6 Kg',6099,1,7,'grm_15','Serves 58-60');

-- 16. Two Tier Polka Dot Rose Groom Cake (two-tier: 1.5-6kg, design=699)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_16','Two Tier Polka Dot Rose Groom Cake','two-tier-polka-dot-rose-groom-cake','Elegant 2-tier white cake with polka dot ribbons, silver pearls, red roses and blazer topper','A beautifully elegant two-tier groom-to-be cake featuring smooth white fondant tiers wrapped with black polka dot ribbons, scattered silver pearl accents and a dapper fondant blazer topper on top. The stunning arrangement of deep red roses with baby''s breath adds romantic flair. Bold black Groom to Be lettering on the bottom tier makes the celebration unmistakable. Perfect for classy bachelor events, engagement dinners and premium pre-wedding parties.',2049,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268359/blissbakery/products/ydm2zvjebdxmsvv380jg.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',699,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_16_v1','1.5 Kg',2049,1,0,'grm_16','Serves 12-15'),
('grm_16_v2','2 Kg',2499,1,1,'grm_16','Serves 18-20'),
('grm_16_v3','2.5 Kg',2949,1,2,'grm_16','Serves 22-25'),
('grm_16_v4','3 Kg',3399,1,3,'grm_16','Serves 28-30'),
('grm_16_v5','3.5 Kg',3849,1,4,'grm_16','Serves 32-35'),
('grm_16_v6','4 Kg',4299,1,5,'grm_16','Serves 38-40'),
('grm_16_v7','5 Kg',5199,1,6,'grm_16','Serves 48-50'),
('grm_16_v8','6 Kg',6099,1,7,'grm_16','Serves 58-60');

-- 17. Gentleman Watch Drip Cake (single-tall: 1-4kg, design=449)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_17','Gentleman Watch Drip Cake','gentleman-watch-drip-cake','Tall cake with hand-painted watch and suit sleeve, black drip and monochrome spheres','A sophisticated and artistic groom-to-be cake featuring a tall cream base with a stunning hand-painted watercolour illustration of a gentleman''s wrist wearing a luxury watch, peeking out from a suit sleeve. Finished with dramatic black chocolate drip, a cluster of black and white chocolate spheres, and scattered pearl accents. This is a truly unique and premium design for the style-conscious groom, ideal for upscale bachelor parties and groom celebrations.',1349,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268359/blissbakery/products/gudrihcnldys4y1r3dun.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',449,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_17_v1','1 Kg',1349,1,0,'grm_17','Serves 8-10'),
('grm_17_v2','1.5 Kg',1799,1,1,'grm_17','Serves 12-15'),
('grm_17_v3','2 Kg',2249,1,2,'grm_17','Serves 18-20'),
('grm_17_v4','2.5 Kg',2699,1,3,'grm_17','Serves 22-25'),
('grm_17_v5','3 Kg',3149,1,4,'grm_17','Serves 28-30'),
('grm_17_v6','3.5 Kg',3599,1,5,'grm_17','Serves 32-35'),
('grm_17_v7','4 Kg',4049,1,6,'grm_17','Serves 38-40');

-- 18. Indian Groom Baraat Celebration Cake (single-tall: 1-4kg, design=449)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_18','Indian Groom Baraat Celebration Cake','indian-groom-baraat-celebration-cake','Tall cream cake with Indian groom in sherwani, dhol, jootis, shehnai and wedding umbrella','A vibrant celebration of Indian wedding traditions, this tall groom-to-be cake features a detailed illustrated Indian groom in a navy sherwani with golden buttons, surrounded by traditional baraat elements. Look for the decorated rajasthani umbrella, shehnai trumpets, dhol drum, embroidered jootis, fresh white roses and scattered gold pearls. Topped with a Groom to Be bow tie topper, this is the ultimate cake for desi bachelor parties, haldi functions and Indian pre-wedding celebrations.',1349,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268360/blissbakery/products/eikoxujdiwj3crk28xp8.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',449,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_18_v1','1 Kg',1349,1,0,'grm_18','Serves 8-10'),
('grm_18_v2','1.5 Kg',1799,1,1,'grm_18','Serves 12-15'),
('grm_18_v3','2 Kg',2249,1,2,'grm_18','Serves 18-20'),
('grm_18_v4','2.5 Kg',2699,1,3,'grm_18','Serves 22-25'),
('grm_18_v5','3 Kg',3149,1,4,'grm_18','Serves 28-30'),
('grm_18_v6','3.5 Kg',3599,1,5,'grm_18','Serves 32-35'),
('grm_18_v7','4 Kg',4049,1,6,'grm_18','Serves 38-40');

-- 19. Chocolate Ombre Tuxedo Cake (single-tall: 1-4kg, design=549)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_19','Chocolate Ombre Tuxedo Cake','chocolate-ombre-tuxedo-cake','Tall chocolate brown ombre fondant cake with tuxedo design, bow tie, collar and piped border','A rich and decadent groom-to-be cake wrapped in stunning chocolate brown ombre fondant that transitions from deep cocoa to warm caramel tones. The tuxedo design features a crisp white fondant collar, a chocolate brown bow tie and detailed buttons, all sitting above a beautifully piped chocolate rosette border. This warm-toned design stands out from the classic black and white options, making it perfect for chocolate-loving grooms and unique bachelor celebrations.',1449,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268361/blissbakery/products/nkwxfiwgjjse3k7ead54.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',549,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_19_v1','1 Kg',1449,1,0,'grm_19','Serves 8-10'),
('grm_19_v2','1.5 Kg',1899,1,1,'grm_19','Serves 12-15'),
('grm_19_v3','2 Kg',2349,1,2,'grm_19','Serves 18-20'),
('grm_19_v4','2.5 Kg',2799,1,3,'grm_19','Serves 22-25'),
('grm_19_v5','3 Kg',3249,1,4,'grm_19','Serves 28-30'),
('grm_19_v6','3.5 Kg',3699,1,5,'grm_19','Serves 32-35'),
('grm_19_v7','4 Kg',4149,1,6,'grm_19','Serves 38-40');

-- 20. Blue Watercolour Mustache Groom Cake (single-fondant-heavy: 1-4kg, design=349)
INSERT INTO Product (id,name,slug,shortDesc,description,basePrice,images,isBestseller,isNew,isFeatured,isAvailable,occasions,forWhom,categoryId,flavours,pricingStrategy,designCharge,base500gPrice,flavourPrices,defaultFlavour,createdAt,updatedAt)
VALUES ('grm_20','Blue Watercolour Mustache Groom Cake','blue-watercolour-mustache-groom-cake','White cake with blue watercolour brushstrokes, gold foil, mustache accent and gold spheres','A fresh and modern groom-to-be cake featuring a smooth white base with artistic blue watercolour brushstrokes at the bottom, scattered gold foil flakes, a charming black fondant mustache, gold pearl accents and clusters of gorgeous gold chocolate spheres. A personalised Groom to Be fondant banner completes the design. This artistic and contemporary cake is perfect for modern bachelor parties, pool-side celebrations and fun pre-wedding events.',1249,'["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1781268362/blissbakery/products/sngqpu7agmgiwkif1mly.jpg"]',0,0,0,1,@occ,@forwho,@cat,@flavs,'CUSTOM',349,450,@fp,'Blueberry',@now,@now);
INSERT INTO ProductVariant (id,name,price,isAvailable,sortOrder,productId,serves) VALUES
('grm_20_v1','1 Kg',1249,1,0,'grm_20','Serves 8-10'),
('grm_20_v2','1.5 Kg',1699,1,1,'grm_20','Serves 12-15'),
('grm_20_v3','2 Kg',2149,1,2,'grm_20','Serves 18-20'),
('grm_20_v4','2.5 Kg',2599,1,3,'grm_20','Serves 22-25'),
('grm_20_v5','3 Kg',3049,1,4,'grm_20','Serves 28-30'),
('grm_20_v6','3.5 Kg',3499,1,5,'grm_20','Serves 32-35'),
('grm_20_v7','4 Kg',3949,1,6,'grm_20','Serves 38-40');
