
const photo_root = "piks\/large\/";
const thumbs_root = "piks\/thumbnail\/";
const shop_css_file = "shop.css";
const receipt_css_file = "receipt.css"
const script_src = "shopfront.js";
const stock_file_name = "stock.txt" ;
const transid_file_name = "transID.txt";
var transID;

const http = require('http');
const fs = require('fs');
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');

const shopItems = [];

///////////////////// Read/Write/Process Files ///////////////////// 

function processFileData( contents ) {
	let stringContents = String( contents );
	let lines = stringContents.split(/\r?\n/);  // forces contents into a string= from object!
	for (let index = 0; index < lines.length; index++) { 
		let line = lines[ index ]; // a line of form: crawdad,Crawdad,It's actually a 'crayfish'.,4.50
		if( line.length > 0 ) {
			let parts = line.split( "," ) // the line broken down into the individual parts
			let item = {id:parts[0], name:parts[1], comment:parts[2], price:parts[3] };
			shopItems.push( item );
		}
	}
}

function readCSV(filename) {
	fs.readFile(filename,
		function(err, contents) {
			if( err ) {
				console.log("Error reading file:" + filename );
			} else {
		       	processFileData( contents );
			}
		}
	);
}

function readTransID(filename) {
	fs.readFile(filename,
		function(err, contents) {
			if( err ) {
				console.log("Error reading file:" + filename );
			} else {
				let stringContents = String(contents);

				transID = +stringContents;
				
				
			}
		}
	);
}

function writeTransID(filename) {
	
	fs.writeFile(filename, transID.toString(), function (err) {
		if (err) 
			return console.log(err);
		console.log('Updated transID in file');
	});

}

readCSV( stock_file_name );

readTransID( transid_file_name );


///////////////////// Server side generation of pages ///////////////////// 


function generatePageHeader( title, css_file) {
	let strVar = "";
	strVar += "<head>";
	strVar += "  <meta charset=\"utf-8\">";
	strVar += "  <link rel=\"stylesheet\" href=\"" + css_file + "\" type=\"text\/css\">";
	strVar += "  <title>" + title + "<\/title>";
	strVar += "<\/head>";
	return strVar;
}

function generateTableHeader() {
	let strVar = "";
	strVar += "  <stock_item>";
	strVar += "    <item_photo class=\"heading\">Photo<\/item_photo>";
	strVar += "    <item_name class=\"heading\">Name<\/item_name>";
	strVar += "    <item_info class=\"heading\">Description<\/item_info>";
	strVar += "    <item_price class=\"heading\"> &pound; (exc. VAT)<\/item_price>";
	strVar += "    <item_quantity class=\"heading\">Quantity<\/item_quantity>";
	strVar += "    <line_cost class=\"heading\">Cost<\/line_cost>";
	strVar += "  <\/stock_item>";
	return strVar;
}

function generateStockItem( id, photo, name, comment, price, quantity, total, report ) {
		let strVar = "";
		strVar += "  <stock_item id=\"" + id + "\">";
		strVar += "    <item_photo><a href=\"" + photo_root + photo + "\"><img alt = \"" + id + "\"" + " src=\"" + thumbs_root + photo + "\" \/><\/a><\/item_photo>";
		strVar += "    <item_name>" + name + "<\/item_name>";
		strVar += "    <item_info>" + comment + "<\/item_info>";
		strVar += "    <item_price>" + price + "<\/item_price>";
		if( report ) {
			strVar += "    <item_quantity>" + quantity + "</item_quantity>";
		} else {
			strVar += "    <item_quantity><input name=\"" + id + "\" type=\"text\" value=\"0\" pattern=\"[0-9]+\" size=\"3\" onchange=\"updateLineCost(this, '" + id + "');\" \/><\/item_quantity>";
		}
		strVar += "    <line_cost>" +  total.toFixed(2) + "<\/line_cost>";
		strVar += "  <\/stock_item>";
		return strVar;
}

function generateStockList() {
	let strVar = "";
	strVar += "<stock_list>";
	strVar += generateTableHeader();
	
	for( let index = 0; index < shopItems.length; index++ ) {
		let item = shopItems[index];
		strVar += generateStockItem( item.id, item.id + ".jpg", item.name, item.comment, item.price, 0, 0, false);
		
	}
	strVar += "<\/stock_list>";
	return strVar;
	
}

function generateTotals() {
	let strVar = "";
	strVar += "<table style=\"padding: 10px; border: 2px solid #1c87c9; border-radius: 5px;background-color: #e5e5e5;\" id=\"costs\">";
	strVar += "<tr><td style=\"text-align: right; border: 0px;\">Sub-total:<span id=\"sub_total\"><\/span><\/td><\/tr>";
	strVar += "<tr><td style=\"text-align: right; border: 0px;\">Delivery charge:<span id=\"delivery_charge\"><\/span><\/td><\/tr>";
	strVar += "<tr><td style=\"text-align: right; border: 0px;\">VAT:<span id=\"vat\"><\/span><\/td><\/tr>";
	strVar += "<tr><td style=\"text-align: right; border: 0px;\">Total:<span id=\"total\"><\/span><\/td><\/tr>";
	strVar += "<\/table>";
	return strVar;
}

function generateCreditCardTypeInput() {
	let strVar = "";
	strVar += "<p>Credit Card type: ";
	strVar += "<select name=\"cc_type\" id=\"cc_type\" size=\"1\" >";
	strVar += "<option value=\"\" selected>-<\/option>";
	strVar += "<option value=\"Mastercard\">MasterCard<\/option>";
	strVar += "<option value=\"Visa\">Visa<\/option>";
	strVar += "<\/select>";
	strVar += "<\/p>";
	return strVar;
}

function generateCreditCardNameInput() {
	let strVar = "";
	strVar += "<p>Name on Credit Card (also the name for delivery): ";
	strVar += "<input type=\"text\" name=\"cc_name\" id=\"cc_name\" pattern=\"^[a-zA-Z0-9.()\\s-]{4,}$\" size=\"80\" required \/>"
	strVar += "<\/p>";
	return strVar;
}

function generateCreditCardNumberInput() {
	let strVar = "";
	strVar += "<p>Credit Card number: ";
	strVar += "<input type=\"text\" name=\"cc_number\" id=\"cc_number\" pattern=\"^[4-5][0-9]{15}$\" size=\"16\" required \/>";
	strVar += "<\/p>";
	return strVar;
} 

function generateCreditCardSecurityCodeInput() {
	let strVar = "";
	strVar += "<p>Credit Card security code: ";
	strVar += "<input type=\"text\" name=\"cc_code\" id=\"cc_code\" pattern=\"^[0-9]{3}$\" size=\"3\" required \/>";
	strVar += "<\/p>";
	return strVar;
}

function generateDeliveryAddressInput() {
	let strVar = "";
	strVar += "<p>Delivery street address: ";
	strVar += "<input type=\"text\" name=\"delivery_address\" id=\"delivery_address\" size=\"128\" required \/>";
	strVar += "<\/p>";
	return strVar;
}

function generateDeliveryPostcodeInput() {
	let strVar = "";
	strVar += "<p>Delivery postcode: ";
	strVar += "<input type=\"text\" name=\"delivery_postcode\" id=\"delivery_postcode\" size=\"40\" required \/>";
	strVar += "<\/p>";
	return strVar
}

function generateDeliveryCountryInput() {
	let strVar = "";
	strVar += "<p>Delivery country: ";
	strVar += "<input type=\"text\" name=\"delivery_country\" id=\"delivery_country\" size=\"80\" required \/>";
	strVar += "<\/p>";
	return strVar
}

function generateDeliveryEmailInput() {
	let strVar = "";
	strVar += "<p>Email: ";
	strVar += "<input type=\"email\" name=\"email\" id=\"email\" pattern=\"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$\" required \/>";
	strVar += "<\/p>";
	return strVar;
}

function generateOrderSubmitInput() {
	let strVar = "";
	strVar += "<input type=\"submit\" name=\"submit\" value=\"Press here to place your order.\" required \/>";
	return strVar
}

function generateForm() {
	let strVar = "";
	strVar += "<div id=\"order_list\">";				
			strVar += "<form name=\"order\" action=\"\" method=\"POST\">";
			strVar += "<table id=\"shop_page\">";
			strVar += "<tr><td>"
			strVar += generateStockList();
			strVar += "<br \/>";
			strVar += generateTotals();
			strVar += "<\/td><td>";
			strVar += generateCreditCardTypeInput();
			strVar += generateCreditCardNameInput();
			strVar += generateCreditCardNumberInput();
			strVar += generateCreditCardSecurityCodeInput();
			strVar += generateDeliveryAddressInput();
			strVar += generateDeliveryPostcodeInput();
			strVar += generateDeliveryCountryInput();
			strVar += generateDeliveryEmailInput();
		
		
		

	strVar += generateOrderSubmitInput();
	strVar += "<\/td><\/tr><\/table>"
	strVar += "<\/div> <!-- order_list -->";
	strVar += "<\/form>"
	return strVar;
}

function generateOrderBody(alert, message) {
	var strVar="";
	strVar += "<body>";
	strVar += "<h1>Items for Sale<\/h1>";
	strVar += "<hr \/>";
	strVar += generateForm();
	strVar += "<script src=\"" + script_src + "\"><\/script>";
	if(alert){
		strVar += "<script>alert(\"" + message + "\"); <\/script>"; 
	}
	strVar += "<\/body>";

	return strVar;
}

function generateOrderHTML(alert, message) {
	var strVar="";
	strVar += "<!DOCTYPE html>";
	strVar += "<html>";
		strVar += generatePageHeader( "Items for Sale", shop_css_file );
		strVar += generateOrderBody(alert, message);
	strVar += "<\/html>";
	return strVar;
}


//////////////////// Receipt and Order generation /////////////////////


function generateReceiptHTML(tokens) {
	var strVar = "";
	strVar += "<!DOCTYPE html>";
	strVar += "<html>";
		strVar += "<body>";
		strVar += "<h1>Receipt<\/h1>";
		strVar += "<hr>";
		strVar += generatePageHeader( "Receipt", receipt_css_file);
		strVar += generateReceiptDetails(tokens);
		strVar += "<table id=\"buttons\">";
		strVar += generateButtons();
		strVar += "<\/table>";
		strVar += "<\/body>";
	strVar += "<\/html>";
	return strVar;
}

function generateReceiptDetails(tokens){
	var strVar = "";

	strVar += "<table id=\"date_transid\">";
	strVar += generateDateTransID();
	strVar += "<\/table>";
	strVar += "<hr>";

	strVar += "<table id=\"receipt_orders\">";
	strVar += generateReceiptOrders(tokens);
	strVar += "<\/table>";
	strVar += "<hr>";

	strVar += "<table id=\"receipt_totals\">";
	strVar += generateReceiptTotals(tokens);
	strVar += "<\/table>";
	strVar += "<hr>";

	strVar += "<table id=\"receipt_details\">";
	strVar += generateReceiptCCdetails(tokens);
	strVar += "<\/table>";
	strVar += "<hr>";

	return strVar;
}

function generateDateTransID(){
	var d = new Date();
	var strVar = "";
	strVar += "<tr><td style=\"text-align: left;\">";
	strVar += "Date:";
	strVar += "<\/td>"

	strVar += "<td style=\"text-align: right;\">";
	strVar += d.getDate() + "/";
	strVar += (d.getMonth() + 1) + "/";
	strVar += d.getFullYear();
	strVar += "<\/td><\/tr>"

	strVar += "<tr><td style=\"text-align: left;\">";
	strVar += "Transaction ID:";
	strVar += "<\/td>"

	transID += 1;
	strVar += "<td style=\"text-align: right;\">";
	strVar += transID;
	strVar += "<\/td><\/tr>"


	return strVar;

}

function generateReceiptOrders(tokens){
	var strVar = "";
	
	strVar += "<tr>";
	strVar += "<td style=\"text-align: center; text-decoration: underline;\">Name<\/td>";
	strVar += "<td style=\"text-align: center; text-decoration: underline;\">Number Ordered<\/td>";
	strVar += "<td style=\"text-align: center; text-decoration: underline;\">Unit Cost<\/td>";
	strVar += "<td style=\"text-align: center; text-decoration: underline;\">Line Cost<\/td>";

	
	strVar += "<\/tr>";


	for(index = 0; index < 5; index ++){

		let numorders = assign(tokens[index]);

		if (numorders > 0){
			strVar += "<tr>";
			strVar += "<td style=\"text-align: center;\">" + shopItems[index].name + "<\/td>";
			strVar += "<td style=\"text-align: center;\">" + numorders + "<\/td>";
			strVar += "<td style=\"text-align: center;\">£" + shopItems[index].price + "<\/td>";
			strVar += "<td style=\"text-align: center;\">£" + (shopItems[index].price * numorders).toFixed(2) + "<\/td>";
			strVar += "<\/tr>";
		}

	}
	return strVar;
}

function generateReceiptTotals(tokens){
	var strVar = "";
	
	let subTotal = 0;

	for (let index = 0; index < 5; index++) { 
		let pair = tokens[index].split('=');
	
		subTotal += (pair[1] * shopItems[index].price); 

	}

	
	var deliveryCharge = 0;
    if (subTotal < 100)
        deliveryCharge = (subTotal * 0.10).toFixed(2);


	var vat = ((+deliveryCharge + +subTotal) * 0.20).toFixed(2);


	var total = (+deliveryCharge + +subTotal + +vat).toFixed(2);


	strVar += "<tr><td style=\"text-align: left;\">Sub-total:<\/td>";
	strVar += "<td style=\"text-align: right;\">£"+ subTotal.toFixed(2) + "<\/td>"
	strVar += "<\/tr>";
	
	strVar += "<tr><td style=\"text-align: left;\">Delivery charge:<\/td>";
	strVar += "<td style=\"text-align: right;\">£"+ deliveryCharge + "<\/td>"
	strVar += "<\/tr>";

	strVar += "<tr><td style=\"text-align: left;\">VAT:<\/td>";
	strVar += "<td style=\"text-align: right;\">£"+ vat + "<\/td>"
	strVar += "<\/tr>";

	strVar += "<tr><td style=\"text-align: left;\">Total:<\/td>";
	strVar += "<td style=\"text-align: right;\">£"+ total + "<\/td>"
	strVar += "<\/tr>";

	return strVar;
}

function generateReceiptCCdetails(tokens){

	let values = [];


	for (let index = 5; index < 13; index++) { 

		values.push(tokens[index].split('=')[1]);


	}


	for (let index = 0; index < values.length; index ++){

		values[index] = values[index].replace(/\+/g, ' ');
		
	}

	let ccnumberpre = values[2].substring(0,2);
	let ccnumberpost = values[2].substring(14,16);

	let ccnumber = ccnumberpre + "************" + ccnumberpost;

	var strVar = "";

	strVar += "<tr><td style=\"text-align: left;\">Credit Card type:<\/td>";
	strVar += "<td style=\"text-align: right;\">" + values[0] + "<\/td><\/tr>"

	strVar += "<tr><td style=\"text-align: left;\">Name on Credit Card:<\/td>";
	strVar += "<td style=\"text-align: right;\">" + values[1] + "<\/td><\/tr>";

	strVar += "<tr><td style=\"text-align: left;\">Credit Card number:<\/td>";
	strVar += "<td style=\"text-align: right;\">" + ccnumber + "<\/td><\/tr>";


	strVar += "<tr><td style=\"text-align: left;\">Delivery street address:<\/td>";
	strVar += "<td style=\"text-align: right;\">" + values[4] + "<\/td><\/tr>";


	
	strVar += "<tr><td style=\"text-align: left;\">Delivery postcode:<\/td>";
	strVar += "<td style=\"text-align: right;\">" + values[5] + "<\/td><\/tr>";


	strVar += "<tr><td style=\"text-align: left;\">Delivery country:<\/td>";
	strVar += "<td style=\"text-align: right;\">" + values[6] + "<\/td><\/tr>";


	return strVar;
}

function generateButtons(){
	var strVar = "";
	strVar += "<tr><td style=\"text-align: left;\"><form name=\"confirm\" action=\"\" method=\"POST\">";
	strVar += "<input type=\"submit\" name=\"submit\" value=\"Press here to confirm your order.\" required \/>";
	strVar += "<\/form><\/td>"
	strVar += "<td><\/td>"
	strVar += "<td><\/td>"
	strVar += "<td><\/td>"
	strVar += "<td style=\"text-align: right;\"><form name=\"back\" action=\"\" method=\"POST\">";
	strVar += "<input type=\"submit\" name=\"submit\" value=\"Press here to cancel and return to the shop.\" required \/>";
	strVar += "<\/form><\/td><\/tr>"

	return strVar;




}

function generateOrderConfirmedHTML(tokens) {
	var strVar = "";
	strVar += "<!DOCTYPE html>";
	strVar += "<html>";
	strVar += "<body>";
		strVar += generatePageHeader( "Order Confirmed", shop_css_file );
		strVar += "Your order has been placed, thank you."
		strVar += "<hr>";
		strVar += "<form name=\"back\" action=\"\" method=\"POST\">";
		strVar += "<input type=\"submit\" name=\"submit\" value=\"Press here to return to the shop.\" required \/>";
		strVar += "<\/form>"
		strVar += "<\/html>";
		strVar += "<\/body>";

	return strVar;
}

function sendReply(res, html) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write(html);
	res.end();
}	

function processForm( chunk, res) {

	if(chunk == "submit=Press+here+to+confirm+your+order."){
		writeTransID( transid_file_name );
		return generateOrderConfirmedHTML();
	} else if (chunk == "submit=Press+here+to+cancel+and+return+to+the+shop."){
		return generateOrderHTML(false);
	} else if (chunk == "submit=Press+here+to+return+to+the+shop."){
		return generateOrderHTML(false);
	}else{



	let tokens = chunk.split('&'); 

	let crawdad = assign(tokens[0]);
	let gorilla = assign(tokens[1]);
	let ninja = assign(tokens[2]);
	let psion = assign(tokens[3]);
	let totem = assign(tokens[4]);
	let cc_type = assign(tokens[5]);
	let cc_name = assign(tokens[6]);
	let cc_number = assign(tokens[7]);
	let cc_code = assign(tokens[8]);
	let delivery_address = assign(tokens[9]);
	let delivery_postcode = assign(tokens[10]);
	let delivery_country = assign(tokens[11]);
	let email = assign(tokens[12]);
	

	let valid = false;
	let message = "";


	let numorders = 0.00;

	numorders += (+crawdad + +gorilla +ninja +psion +totem);
	
	
	if( !(numorders == 0.00)){	
		if(cc_type === "Mastercard" && cc_number.substring(0,1) === "5" ){
			valid = true;
		} else if (cc_type === "Visa" && cc_number.substring(0,1) === "4"){				
			valid = true;
		}
		
	

		if(!valid){
			if(cc_type === ""){
				message = "Please select a credit card type";
			} else {
				message = "Mastercard card numbers must start with a 5, and Visa card numbers must start with a 4";
			}
		}
		

	} else {
		message = "You cannot order 0 items"
	}


	console.log(valid);

   	if(valid){
		return generateReceiptHTML(tokens);
	} else{
		return generateOrderHTML(true, message);
	} 

}

}

function assign (token){
	let tokens = token.split('=');
	return tokens[1];
}

///////////////////// Request handlers ///////////////////// 

function handlePost( req, res ) {
	let html = "";
	console.log('post: ' + req.url);
	req.setEncoding('utf8');
	req.on('data', chunk => {
		console.log('Got a line of post data: ', chunk);
		html = processForm( chunk, res );
	})
	req.on('end', () => {
	   	console.log('End of Data - sending reply');
   		sendReply(res,html); 
	})

}

function handleGet( req, res ) {
    console.log('get: ' + req.url);
    if (req.url === '/'){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write( generateOrderHTML(false) );
        res.end();
    } else {
        fs.readFile('./' + req.url, (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end(JSON.stringify(err));
              return;
            }
            res.writeHead(200);
            res.end(data);
        });
    }
}

///////////////////// The Server ///////////////////// 

const server = http.createServer(
	function (req, res) {
		if(req.method == "GET"){ 
			handleGet( req, res );
		} else if(req.method == 'POST'){
    		handlePost( req, res );
		}
	}
);
server.listen(21929, '127.0.0.1');
console.log('Server running');



