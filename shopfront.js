const { parse } = require("path");

/*
 * item_id: string (id of item)
 * element: string (tag name of element)
 */
function getStockItemValue(item_id, element) {
  var i = document.getElementById(item_id);
  var e = i.getElementsByTagName(element)[0];  // assume only 1!
  var v = e.innerHTML;
  return v;
}

/*
 * item_id: string (id of item)
 * element: string (tag name of element)
 * value: string (the value of the element)
 */
function setStockItemValue(item_id, element, value) {
  var i = document.getElementById(item_id);
  var e = i.getElementsByTagName(element)[0];  // assume only 1!
  e.innerHTML = value;
}

/*
 * e: object from DOM tree (item_quantity that made )
 * item_id: string (id of item)
 */
function updateLineCost(e, item_id) {
  var p = getStockItemValue(item_id, "item_price");
  var q = e.value;  
  var c = p * q; // implicit type conversion
  c = c.toFixed(2); // 2 decimal places always.
  setStockItemValue(item_id, "line_cost", c);


  updateTotals();
  
}


  //updates subtotal, delivery charge and VAT and total
  function updateTotals(){

    /////////////////////// sub total /////////////////////
    var lineCosts = document.getElementsByTagName("line_cost");

    var subTotal = 0;

    for(let index = 1; index < lineCosts.length; index++ ) {
      subTotal += +lineCosts[index].innerHTML;
    }
    
    subTotal = subTotal.toFixed(2);

    
    document.getElementById("sub_total").innerHTML = " £" + subTotal;
    /////////////////////// sub total /////////////////////  


    /////////////////////// delivery charge /////////////////////
    var deliveryCharge = 0;
    
    if (subTotal < 100)
        deliveryCharge = (subTotal * 0.10).toFixed(2);

    document.getElementById("delivery_charge").innerHTML = " £" + deliveryCharge;
    /////////////////////// delivery charge /////////////////////



    /////////////////////// vat /////////////////////
    var vat = ((+deliveryCharge + +subTotal) * 0.20).toFixed(2);

    document.getElementById("vat").innerHTML = " £" + vat;
    /////////////////////// vat /////////////////////



    /////////////////////// total /////////////////////
    var total = (+deliveryCharge + +subTotal + +vat).toFixed(2);

    document.getElementById("total").innerHTML = " £" + total;
    /////////////////////// total /////////////////////
}

