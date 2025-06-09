import { 
	initializeApp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  	getDatabase, 
  	ref, 
  	set, 
  	onValue, 
  	remove 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKvL-_5LoZp_gLLgzUMaCPyxt_1TEk-PM",
  authDomain: "checkin-cashless.firebaseapp.com",
  databaseURL: "https://checkin-cashless-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "checkin-cashless",
  storageBucket: "checkin-cashless.appspot.com",
  messagingSenderId: "579916995873",
  appId: "1:579916995873:web:c191bd9674e37d6827f260"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let getfoods = ref(database, "Foods/");
let orderList = document.querySelector('table tbody');
let foodsDataArray = [];
let totalPrice = 0;
let payment = document.querySelector('#pay');



onValue(getfoods, (snapshot) => {
    let foods = snapshot.val()
    foodsDataArray = [];
    let No = 0;
    for (var food in foods) {
        foodsDataArray.push([No, food, foods[food].Price,0, foods[food].Sold]);    
        No++;
    }
    createOrderList(foodsDataArray);
    console.log(foodsDataArray,length);
});

function createOrderList(dataArray){
    totalPrice = 0;
    let fragment = document.createDocumentFragment();
    dataArray.forEach((foodData, index) => {
        totalPrice += foodData[3] * foodData[2]
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700;">${foodData[1]}</td>
            <td style=" width: 30%">${new Intl.NumberFormat('vi-VN').format(foodData[2])} VND</td>
            <td style="text-align: center; width: 10%">
                <span class="material-symbols-rounded edit-user-button remove" no="${foodData[0]}">remove</span>
            </td>
            <td style="text-align: center; width: 15%">${foodData[3]}</td>
            <td style="text-align: center; width: 10%">
                <span class="material-symbols-rounded edit-user-button add" no="${foodData[0]}">add</span>
            </td>
        `;
        fragment.appendChild(tr);
    });
    orderList.innerHTML = '';
    orderList.appendChild(fragment);
    document.getElementById("total").innerHTML = `${new Intl.NumberFormat('vi-VN').format(totalPrice)} VND`;
}

orderList.addEventListener("click", (e) => {
    if (e.target.classList.contains("add")) {
        let row = e.target.getAttribute("no");
        let Data = foodsDataArray[row];
        let number = Data[3] + 1;
        foodsDataArray[row][3] = number;
        createOrderList(foodsDataArray);
    }
})

orderList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove")) {
        let row = e.target.getAttribute("no");
        let Data = foodsDataArray[row];
        let number = Data[3] - 1;
        foodsDataArray[row][3] = number < 0 ? 0 : number;
        createOrderList(foodsDataArray);
    }
})

let isListening = false;

payment.addEventListener("click", () => {
    let deviceInput = document.getElementById('device');
    let device = deviceInput.value.trim();
    if (device === "") {
        deviceInput.reportValidity();
    } else {
        set(ref(database, "Devices/" + device), {
            Type: "POS",
            Price: String(totalPrice),
            Status: "Waiting",
            Name: "",
        });
        document.querySelector('#a').style.display = 'none';
        document.querySelector('#b').style.display = 'flex';

        const deviceRef = ref(database, "Devices/" + device + "/Status");

        if (!isListening) {
            onValue(deviceRef, (snapshot) => {
                const status = snapshot.val();
                if (status === "Successfully") {
                    document.querySelector('#b').style.display = 'none';
                    document.querySelector('#a').style.display = 'block';

                    const deviceName = ref(database, "Devices/" + device + "/Name");
                    onValue(deviceName, (snapshot) => {
                        const transferName = snapshot.val();
                        addtransfers();
                    });

                    alert("Successfully!");
                    totalPrice = 0;
                    foodsDataArray.forEach(foodData => foodData[3] = 0);
                    createOrderList(foodsDataArray);
                } else if (status === "Not enough funds") {
                    document.querySelector('#b').style.display = 'none';
                    document.querySelector('#a').style.display = 'block';
                    alert("Insufficient balance!");
                }
            });
            isListening = true;
        }
    }
});


function addtransfers(){
    for (var i = 0; i < foodsDataArray.length; i++) {
        var foodItem = foodsDataArray[i];
        if (foodItem[3] != 0) {
            console.log("aa");
            var currentSold = parseInt(foodItem[4]);

            set(ref(database, "Foods/" + foodItem[1]), {
                Price: String(foodItem[2]),
                Sold: String(currentSold + parseInt(foodItem[3])),
            });    
        }
    }
}

