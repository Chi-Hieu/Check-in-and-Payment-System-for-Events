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

let collapse_menu = document.querySelector("#collapse-menu");
let sidebar = document.querySelector("#sidebar");

let nav_list = document.querySelectorAll("#sidebar > div > div");
let main_tab = document.querySelectorAll("main > div");

document.addEventListener("DOMContentLoaded", function() {
	nav_list[0].style.background = '0#3A3A3A'
	main_tab[0].style.display = 'block';
	main_tab[1].style.display = 'none';
	main_tab[2].style.display = 'none';
	main_tab[3].style.display = 'none';
	main_tab[4].style.display = 'none';
});

collapse_menu.onclick = function(){
	sidebar.classList.toggle("collapse");
}

function showTab(index) {
    main_tab.forEach((content, i) => {
        if (i === index) {
        	content.style.display = 'block';
        	nav_list[i].style.background = '0#3A3A3A'
        } else {
            content.style.display = 'none';
            nav_list[i].style.background = 'none'
        }
    });
}

nav_list.forEach((navItem, index) => {
    navItem.addEventListener("click", () => {
        showTab(index);
    });
});

function enableBlur(i){
    if (i){
        document.querySelector('#sidebar').classList.add("blur");
        document.querySelector('.toolbar').classList.add("blur");
        document.querySelector('.table').classList.add("blur");
        document.body.classList.add('no-scroll')
    } else {
        document.querySelector('#sidebar').classList.remove("blur");
        document.querySelector('.toolbar').classList.remove("blur");
        document.querySelector('.table').classList.remove("blur");
        document.body.classList.remove('no-scroll')
    }
}


// ****************************TRANSFERS****************************** //
// ****************************TRANSFERS************************** //

let gettransfers = ref(database, "Transfers/");
let transfersDataTable = document.querySelector('#transfers-table tbody');


        // Get food data from Firebase and create table
onValue(gettransfers, (snapshot) => {
    let transfers = snapshot.val()
    let fragment = document.createDocumentFragment();
    let No = 0;
    let date = 0;
    let time = 0;
    let device = 0;
    for (var transferDate in transfers) {
        let transferData = transfers[transferDate];
        date = transferDate.replace(/(\d{2})(\d{2})(\d{4})/, "$1-$2-$3");
        for (var transferTime in transferData) {
            No++;
            time = transferTime.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, "$1:$2:$3");
            device = transferTime.substring(6);

            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center;">${No}</td>
                <td style="text-align: center;">${date}</td>
                <td style="text-align: center;">${time}</td>
                <td style="text-align: center;">${transferData[transferTime].User}</td>
                <td style="text-align: center;">${new Intl.NumberFormat('vi-VN').format(transferData[transferTime].Amount)} VND</td>
                <td style="text-align: center;">POS ${device}</td>
            `;
            fragment.appendChild(tr);
        }
    }
    transfersDataTable.innerHTML = '';
    transfersDataTable.appendChild(fragment);
});   

// ******************************USERS****************************** //
// ******************************USERS****************************** //

let getUID = ref(database, "Users/");
let userDataArray = [];
let userDataTable = document.querySelector('#users-table tbody');
let addUser = document.querySelector('#add-user');
let userForm = document.querySelector('#user-form');
let userPopup = document.querySelector('#user-popup');
let userSubmit = document.querySelector('#user-submit')
let closeUserPopup = document.querySelector('#close-user-popup')
let usersSearch = document.querySelector('#users-search');


        // Get user data from Firebase
onValue(getUID, (snapshot) => {
    let UID = snapshot.val()
    userDataArray = [];
    for (var uid in UID) {
        userDataArray.push([uid, UID[uid].Name, UID[uid].Type, UID[uid].Balance, UID[uid].Status]);    
    }
    function getFirstName(fullName) {
        const nameParts = fullName.trim().split(' ');
        return nameParts[nameParts.length - 1];
    }
    function sortByFirstName(a, b) {
        const firstNameA = getFirstName(a[1]);
        const firstNameB = getFirstName(b[1]);
        return firstNameA.localeCompare(firstNameB, 'vi');
    }
    userDataArray.sort(sortByFirstName);
    createUsersTable(userDataArray);
    console.log('Users: ' + userDataArray.length);
});

        // Create user table
function createUsersTable(dataArray){
    let No = 0;
    let checkin = 0
    let fragment = document.createDocumentFragment();
    dataArray.forEach((userData, index) => {
        No = index + 1;
        let tr = document.createElement('tr');
        checkin = userData[4] != 0 ? checkin + 1 : checkin;
        let status = userData[4] == 0 
                ? '<div style="background: red"></div>' 
                : '<div style="background: green"></div>';
        tr.innerHTML = `
            <td class="no.-col" style="text-align: center;">${No}</td>
            <td class="uid-col" style="text-align: center;">${userData[0]}</td>
            <td class="name-col">${userData[1]}</td>
            <td class="type-col" style="text-align: center;">${userData[2]}</td>
            <td class="balance-col" style="text-align: center;">${new Intl.NumberFormat('vi-VN').format(userData[3])} VND</td>
            <td class="status-col">${status}</td>
            <td class="action-col" style="text-align: center;">
                <span class="material-symbols-rounded edit-user-button" no. = "${No}">tune</span>
                <span class="material-symbols-rounded delete-user-button" uid="${userData[0]}" name="${userData[1]}">delete</span>
            </td>
        `;
        fragment.appendChild(tr);
    });
    userDataTable.innerHTML = '';
    userDataTable.appendChild(fragment);
    document.getElementById("total-Users").innerHTML = new Intl.NumberFormat('vi-VN').format(No);
    document.getElementById("users-check-in").innerHTML = new Intl.NumberFormat('vi-VN').format(checkin);
}

        // Show user popup
addUser.addEventListener("click",() => {
    userForm.reset();
    enableBlur(1);
    document.querySelector('#user-form .popup-name').innerHTML = "ADD USER"
    userPopup.style.display = "block";
    userForm.status.value = 0;
    document.querySelector('#UID-input').readOnly = false;
})

        // Close user popup
closeUserPopup.addEventListener("click",() =>{
    enableBlur(0);
    userForm.reset();
    userPopup.style.display = "none";
})

        // Button to push user data
userSubmit.addEventListener("click",()=>{
  userForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const uid = userForm.uid.value;
    const name = userForm.name.value;
    const type = userForm.type.value;
    const balance = userForm.balance.value;
    const status = userForm.status.value;
    set(ref(database, "Users/" + uid), {
      Name: name,
      Type: type,
      Balance: balance,
      Status: status,
    });
  })
  userPopup.style.display = "none";
  enableBlur(0);
})

        // Search user
usersSearch.addEventListener('keyup', function() {
    let table = document.getElementById("users-table");
    let tr = table.getElementsByTagName("tr");
    let searchText = usersSearch.value.toUpperCase();
    let searchTextWithoutDiacritics = searchText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D");

    for (var i = 0; i < tr.length; i++) {
        let td = tr[i].getElementsByTagName("td")[2];
        if (td) {
            tr[i].style.display = "none";
            let name = (td.textContent || td.innerText).toUpperCase();
            let nameWithoutDiacritics = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D");
            if (nameWithoutDiacritics.indexOf(searchTextWithoutDiacritics) > -1 || name.indexOf(searchText) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
});

        // Edit user
userDataTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-user-button")) {
        enableBlur(1);
        document.querySelector('#user-form .popup-name').innerHTML = "EDIT USER"
        let row = e.target.getAttribute("no.");
        let userData = userDataArray[row - 1];
        console.log(userDataArray[row - 1]);
        let uid = userData[0];
        let name = userData[1];
        let type = userData[2];
        let balance = userData[3];
        let status = userData[4];
        userPopup.style.display = "block";
        userForm.uid.value = uid;
        userForm.name.value = name;
        userForm.type.value = type;
        userForm.balance.value = balance;
        userForm.status.value = status;
        document.querySelector('#UID-input').readOnly = true;
    }
})

        // Delete user 
userDataTable.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-user-button")) {
    let uid = e.target.getAttribute("uid");
    let name = e.target.getAttribute("name");
  const confirmation = confirm(`Are you sure you want to delete ${name} (UID: ${uid}) ?`);
    if (confirmation) {
      remove(ref(database, "Users/" + uid));
      console.log( 'Deleted ' + name + ' (' + uid + ')');
    } else {}
  }
});

// ******************************FOODS****************************** //
// ******************************FOODS****************************** //

let getfoods = ref(database, "Foods/");
let foodDataTable = document.querySelector('#foods-table tbody');
let addFood = document.querySelector('#add-food');
let foodForm = document.querySelector('#food-form');
let foodPopup = document.querySelector('#food-popup');
let foodSubmit = document.querySelector('#food-submit')
let closeFoodPopup = document.querySelector('#close-food-popup')


        // Get food data from Firebase and create table
onValue(getfoods, (snapshot) => {
    let foods = snapshot.val()
    let fragment = document.createDocumentFragment();
    let No = 0;
    let totalSold = 0;
    let totalRevenue = 0;
    for (var food in foods) {
        No++;
        let revenue = foods[food].Sold * foods[food].Price;
        totalSold += foods[food].Sold * 1;
        totalRevenue += revenue;
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">${No}</td>
            <td>${food}</td>
            <td style="text-align: center;">${new Intl.NumberFormat('vi-VN').format(foods[food].Price)} VND</td>
            <td style="text-align: center;">${new Intl.NumberFormat('vi-VN').format(foods[food].Sold)}</td>
            <td style="text-align: center;">${new Intl.NumberFormat('vi-VN').format(revenue)} VND</td>
            <td class="action-col" style="text-align: center;">
                <span class="material-symbols-rounded edit-food-button">tune</span>
                <span class="material-symbols-rounded delete-food-button" name="${food}">delete</span>
            </td>
        `;
        fragment.appendChild(tr);
    }
    foodDataTable.innerHTML = '';
    foodDataTable.appendChild(fragment);
    document.getElementById("total-Foods").innerHTML = new Intl.NumberFormat('vi-VN').format(No);
    document.getElementById("foods-sold").innerHTML = new Intl.NumberFormat('vi-VN').format(totalSold);
    document.getElementById("total-sales").innerHTML = `${new Intl.NumberFormat('vi-VN').format(totalRevenue)} VND`;
});

        // Show food popup
addFood.addEventListener("click",() => {
    foodForm.reset();
    enableBlur(1);
    document.querySelector('#food-form .popup-name').innerHTML = "ADD FOOD"
    foodPopup.style.display = "block";
    document.querySelector('#food-input').readOnly = false;
})

        // Close food popup
closeFoodPopup.addEventListener("click",() =>{
    enableBlur(0);
    foodForm.reset();
    foodPopup.style.display = "none";
})

        // Button to push food data
foodSubmit.addEventListener("click",()=>{
  foodForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const name = foodForm.name.value;
    const price = foodForm.price.value;
    const sold = foodForm.sold.value;
    set(ref(database, "Foods/" + name), {
      Price: price,
      Sold: sold,
    });
  })
  foodPopup.style.display = "none";
  enableBlur(0);
})


        // Edit food
foodDataTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-food-button")) {
        enableBlur(1);
        document.querySelector('#food-form .popup-name').innerHTML = "EDIT FOOD"
        let row = e.target.closest("tr");
        let name = row.querySelector("td:nth-child(2)").textContent;
        let price = row.querySelector("td:nth-child(3)").textContent.replace(/\D/g, '');
        let sold = row.querySelector("td:nth-child(4)").textContent.replace(/\D/g, '');
        foodPopup.style.display = "block";
        foodForm.name.value = name;
        foodForm.price.value = price;
        foodForm.sold.value = sold;
        document.querySelector('#food-input').readOnly = true;
    }
})

        // Delete user 
foodDataTable.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-food-button")) {
    let name = e.target.getAttribute("name");
  const confirmation = confirm(`Are you sure you want to delete ${name} ?`);
    if (confirmation) {
      remove(ref(database, "Foods/" + name));
      console.log( 'Deleted ' + name);
    } else {}
  }
});

// *****************************DEVICES****************************** //
// *****************************DEVICES****************************** //

let getDevices = ref(database, "Devices/");
let deviceDataTable = document.querySelector('#devices-table tbody');


        // Get food data from Firebase and create table
onValue(getDevices, (snapshot) => {
    let devices = snapshot.val()
    let fragment = document.createDocumentFragment();
    let No = 0;
    for (var device in devices) {
        No++;
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">${No}</td>
            <td>Device ${device}</td>
            <td style="text-align: center;">${devices[device].Type}</td>
        `;
        fragment.appendChild(tr);
    }
    deviceDataTable.innerHTML = '';
    deviceDataTable.appendChild(fragment);

});