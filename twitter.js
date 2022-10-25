import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.9.4/firebase-database.js";
import { getAuth, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmlQxw5_7_8mKK4FnfLvulH_UcB3CPshU",
  authDomain: "organic-tree-333900.firebaseapp.com",
  databaseURL: "https://organic-tree-333900-default-rtdb.firebaseio.com",
  projectId: "organic-tree-333900",
  storageBucket: "organic-tree-333900.appspot.com",
  messagingSenderId: "739108783002",
  appId: "1:739108783002:web:d9a5b57d8b84d3cfe03023",
  measurementId: "G-TS1JYSJ24Y"
};
firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
let tweetsRef = firebase.database().ref("/tweets");
const auth = getAuth();

var loggedUser;

$(`#sign-out`).on('click', () => {
  signOut(auth).then(() => {
    $("#main-page").hide();
    $("#login-page").show();
    history.go(0);
  }).catch((error) => {
    // An error happened.
  });
});

let writeUserData = ( username, userhandle, picture) => {
  let userRef = firebase.database().ref("/users");
  let newuser = {
      name: username,
      handle: userhandle,
      pic: picture,
  }
  userRef.push(newuser);
}

let renderLogin = () => {
  $("#main-page").hide;
  $("#login-page").show;
  
  // Login with Google
  $("#login-button").on("click", evt=> {
    let app = firebase.app();
    firebase.auth().onAuthStateChanged(user => {
      console.log(user);
      console.log("logged in");
    });
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access Google APIs.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      var userName = user.displayName;
      var profile = user.photoURL;
      var email = user.email.split('@')[0];
      writeUserData( userName, email, profile);

    }).catch((error) => {
      // Handle Errors here.
      // ...
    });
  });
}


let renderedTweetLikeLookup = {};
//rendering tweet
let renderTweet = (tObj,uuid)=>{
  $("#tweetwrap").append(`
  <div class="tweet-wrap">
    <div class="tweet-header">
      <img src="${tObj.author.pic}" alt="" class="avator">
      <div class="tweet-header-info">
        ${tObj.author.name} <span>${tObj.author.handle}</span><span>. ${tObj.timestamp} </span>
        <p> ${tObj.content}</p>
      </div>
    </div>
    <div class="tweet-info-counts">
      <div class="likes">
        <svg data-tweetid="${uuid}" type="button" id="like-button" class="feather feather-heart sc-dnqmqq jxshSx" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <div class="likes-count">${tObj.likes}</div>
      </div>
    </div>
  </div>
  `);
  renderedTweetLikeLookup[uuid] = tObj.likes;
  firebase.database().ref("/tweets").child(uuid).child("likes").on("value", ss=>{
    renderedTweetLikeLookup[uuid]= ss.val();
    $(`.likebutton[data-tweetid=${uuid}]`).html(`${renderedTweetLikeLookup[uuid]} Likes`);
    console.log(renderedTweetLikeLookup[uuid]);
  })
}
let tweetRef = firebase.database().ref("/tweets");

let renderPage = (loggedIn)=>{
  var username = loggedIn.displayName;
  var picture = loggedIn.photoURL;
  let myuid = loggedIn.uid;
  var userhandle = loggedIn.email.split('@')[0];

  let tweetsRef = firebase.database().ref("/tweets");
  $("#tweet-button").on("click", ()=>{
    let newTweet = {
      author: {
        name: username,
        handle: userhandle,
        pic: picture,
      },
      content: $("#tweet-input").val(),
      likes: 0,
      timestamp: Date.now(),
    }
    tweetsRef.push(newTweet);
  });

  tweetRef.on("child_added", (ss)=>{    
    const user = firebase.auth().currentUser; 
    let tObj = ss.val();
    let uuid = ss.key;      
    renderTweet(tObj,uuid);
    $(".likebutton").off("click");
    $(".likebutton").on("click", (evt)=>{
      let clickedTweet = $(evt.currentTarget).attr("data-tweetid");
      let tweetRef = firebase.database().ref("/tweets").child(clickedTweet);
      toggleLike(tweetRef, user.uid);
    });
  });
};


let toggleLike = (tweetRef, uid)=> {
  tweetRef.transaction((tObj) => {
    console.log(tObj);
    if (tObj) {
      if(tObj.likes && tObj.liked_by_user && tObj.liked_by_user.hasOwnProperty(uid)){
        tObj.likes--;
        tObj.liked_by_user[uid] = null;
      } else {
        tObj.likes++;
        if (!tObj.liked_by_user) {
          tObj.liked_by_user = {};
        }
        tObj.liked_by_user[uid] = true;
      }
    }
    return tObj;
  });
}

firebase.auth().onAuthStateChanged(user => {
  let tweetsRef = firebase.database().ref("/tweets");
  if (user) {
    // User is signed in, see docs for a list of available properties
    $("#main-page").show();
    $("#login-page").hide();
    renderPage(user);
    // tweetsRef.on("child_added", renderTweetSnapshot);
  } else {
    // User is signed out
    renderLogin();
    $("#main-page").hide();
  }
});

