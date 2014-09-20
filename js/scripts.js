// Global Variables
var xmlhttp;
var oldFileSize = 0;
var updateRequired = false;
var cycles = 0.20;
var curCycle = 1;

$(function(){
    setupHeader();
    setupChat();
    updateChat();
    runAtLoad();
    setupUsernamePopup();
})

function setupUsernamePopup(){
    var userDialog = $(".username-dialog");
    userDialog.find('.username').keydown(function(e){
        if(e.which == 13 ){
            setUsername($(this).val());
            userDialog.removeClass('visible');
        }
    })

    userDialog.find('.submit').click(function(){
        setUsername(userDialog.find('.username').val());
        userDialog.removeClass('visible');
    })

    userDialog.find('.cancel').click(function(){
        userDialog.removeClass('visible');
    })

}

function runAtLoad() {
    loadXMLDoc();
    if(getUsername().trim() != ""){
        $('.inputarea .message').attr('placeholder',"Send chat message as "+getUsername());
    }
}

function loadXMLDoc() {
    curCycle++;
    if (curCycle < cycles) {
        return;
    } else {
        curCycle = 0;
    }
    //use jquery to check if updates are required.
    $.ajax({
        cache: false,
        type: 'HEAD',
        url:"/rooms/"+room+".txt",
        success: function (d, r, xhr) {
            var size = xhr.getResponseHeader('Content-Length');
            if(size == null){
                size = 0;
            }
            if (size != oldFileSize) {
                updateRequired = true;
                oldFileSize = size;
                //console.log("update Required");
                cycles = .2;
                curcycle = 0;
            } else {
                updateRequired = false;
                if (cycles < 5) cycles = cycles + 0.2;
                //console.log("Will check for updates after " + cycles + " seconds");
            }
        }
    });
    if (updateRequired == true) {
        updateChat();
        updateRequired = false;

        //play audio
        if (!new Audio().canPlayType('audio/mpeg;')) {
            $('.notifications').hide();
        } else if ($(".header .enable-notifications").is(":checked")) {
            new Audio("sounds/ding.mp3").play(); // buffers automatically when created
        }
    }
}
//once a second, call loadSXMLDoc which SHOULD pull from cache unless changed
setInterval(function () {
    loadXMLDoc();
}, 1000);

function usernamePopup(){
    var userDialog = $(".username-dialog");
    userDialog.show();
    userDialog.height(userDialog.outerHeight());
    userDialog.css('position','fixed');
    userDialog.addClass('visible');
    userDialog.find('.username').focus();
}

function setupHeader(){
    $(".header .has-menu").click(function(e){
        e.preventDefault();
        e.stopPropagation();
        $(this).toggleClass("menuopen");
    })

    $(".header .has-menu ul").click(function(e){
        e.stopPropagation();
        closeMenus();
        //e.preventDefault();
    })

    $(".header .clear").click(function(){
        clearChat();
    })

    $(".header .change-username").click(function(){
        usernamePopup();
    })

    $("html").click(function(){
        closeMenus();
    })
}

function closeMenus(){
    $(".has-menu").removeClass("menuopen");
}

function setupChat(){
    var sendButton = $(".inputarea .send");
    var inputArea = $(".inputarea .message");

    inputArea.keydown(function(e){
        if(e.which == 13){
            e.preventDefault();
            e.stopPropagation();
            submitMessage();
        }
    })

    sendButton.click(function(){
        submitMessage();
    })
}

function submitMessage(){
    var chatarea = $('.chatarea');
    var inputArea = $('.inputarea .message');
    if(getUsername() != ""){
        $.ajax("/submit.php",{
            data:{
                room:"N",
                message:inputArea.val(),
                user:getUsername()
            },
            success:function(data,textStatus,jqHXR){
                updateChat();
                inputArea.val("");
            }
        })
    }else {
        usernamePopup();
    }

}

function clearChat(){
    $.ajax("/clear.php",{
        data:{
            room:room
        },
        success:function(data,textStatus){
            setTimeout(function(){
                updateChat();
            },100);
        }
    })
}

function updateChat(){
    var chatarea = $('.chatarea');
    $.ajax("/retrieve.php",{
        method:"POST",
        data:{
            room:room
        },
        success:function(data,textStatus,jqXHR){
            var html = $(data);
            var hasMessages = false;
            html.find('.timestamp').each(function(){
                hasMessages = true;
                $(this).html(timeDifference($.now()/1000,$(this).html()));
            })
            if(hasMessages == true){
                chatarea.html(html);
            }else {
                chatarea.html('<div class="no-messages">No messages to display.</div>');
            }
        }
    })
}

//prints the "cleared" message if the room is cleared.
function notifyEmpty() {
    //room was cleared notification
    //xmlhttp.open("GET", 'rooms/<?php print(($_GET['room'] == "") ? "anything" : $_GET['room']); ?>clear.txt', true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById('output').innerHTML = xmlhttp.responseText;
        }
    }
}
function timeDifference(current, previous) {
    var secPerMinute = 60;
    var secPerHour = secPerMinute * 60;
    var secPerDay = secPerHour * 24;
    var secPerMonth = secPerDay * 30;
    var secPerYear = secPerDay * 365;
    var elapsed = current - previous;
    if (elapsed < secPerMinute) {
        return Math.round(elapsed) + ' seconds ago';
    }
    else if (elapsed < secPerHour) {
        return Math.round(elapsed / secPerMinute) + ' minutes ago';
    }
    else if (elapsed < secPerDay) {
        return Math.round(elapsed / secPerHour) + ' hours ago';
    }
    else if (elapsed < secPerMonth) {
        return 'approximately ' + Math.round(elapsed / secPerDay) + ' days ago';
    }
    else if (elapsed < secPerYear) {
        return 'approximately ' + Math.round(elapsed / secPerMonth) + ' months ago';
    }
    else {
        return 'approximately ' + Math.round(elapsed / secPerYear) + ' years ago';
    }
}

function getUsername(){
    return getCookie('name');
}

function setUsername(value){
    setCookie('name',value);
    $(".inputarea .message").attr('placeholder','Send chat message as '+value);
    $('.username-dialog .username').val("");
}

function setCookie(cname,value){
    document.cookie=""+cname+"="+value+"";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}