var id;
var voted;
$(document).ready(function(){

  var address="/polls"+window.location.pathname;
  id=address.slice(12)
  var voted=false;

  // Get data
  getData(address);

});



function createHeader(question, owner){
  var place=document.getElementById("header");
  var Q=document.createElement("h4");
  Q.innerHTML=question;
  Q.setAttribute("class", "title")
  var owns=document.createElement("h8");
  owns.innerHTML="created by "+owner;
  owns.setAttribute("class", "createdby")
  place.appendChild(Q);
  place.appendChild(owns);
}

// Creates share button

function createShare(){
  var place=document.getElementById("share");
  var shareAddress=window.location.href;
  var A=document.createElement("a");
  A.href="http://www.facebook.com/sharer/sharer.php?u="+shareAddress;
  A.target="_blank"
  var btndiv=document.createElement("div");
  btndiv.setAttribute("class", "btn btn-primary share-btn");
  btndiv.innerHTML="Share on Facebook";
  A.appendChild(btndiv);
  place.appendChild(A);

}


// creates the for to vote from the details of the poll
function createForm(data, options, votes, owns){
  var place=document.getElementById("poll");
  var form=document.createElement("form");
  form.setAttribute("method", "post")
  form.setAttribute("action","/polls"+id)
  form.id="vote"
  place.appendChild(form)
  var j=0;
  options.forEach(function(item,i){
    j=i;
    var inputsect=document.createElement("input");
    inputsect.type="radio";
    inputsect.name="vote";
    inputsect.id=i;
    inputsect.setAttribute("class", "vote")
    inputsect.setAttribute("style", "vertical-align:left")
    inputsect.value=item;

    var label=document.createElement("label")
    label.setAttribute("for", inputsect.id)
    label.setAttribute("class", "vote");
    label.innerHTML=item;
    var span=document.createElement("span");
    span.appendChild(document.createElement("span"))
    label.appendChild(span)

    form.appendChild(inputsect)
    form.appendChild(label)
    form.appendChild(document.createElement("br"))


  })
  //Logged in user can add more options
  if(owns){
    var inputsect=document.createElement("input");
    inputsect.type="radio";
    inputsect.name="vote";
    inputsect.id="otherbtn";
    inputsect.setAttribute("class", "vote other");
    inputsect.value="";


    var label=document.createElement("label")
    label.setAttribute("for", inputsect.id)
    label.setAttribute("class", "vote");
    label.innerHTML="Other: ";
    var box=document.createElement("input");
    box.type="text";
    box.id="otherbox";
    box.value="";
    box.autocomplete="off";
    box.onchange=addValue;
    label.appendChild(box)

  var span=document.createElement("span");
  span.appendChild(document.createElement("span"))
  label.appendChild(span)

  form.appendChild(inputsect)
  form.appendChild(label)
  form.appendChild(document.createElement("br"))
}
  var sub=document.createElement("input")
  sub.setAttribute("type", "submit")
  sub.setAttribute("class", "btn btn-default")
  sub.setAttribute("value", "Vote")
  form.appendChild(sub)

  if(!owns){
    var advice=document.createElement("p")
    advice.innerHTML="Log in to add more options"
    place.appendChild(advice)
  }


};

function addValue(){
  var inp=document.getElementById("otherbtn");
  inp.value=$(this).val();
};

//Gets the details of the poll from the database and calls plot
function getData(address){

  $.get(address, function(data){
      var question=data.question;
      var owner=data.createdBy.username;
      createHeader(question, owner);
      createShare();
    var options=$.map(data.answers, function(value, index){
      return value.option;
    });
    var votes=$.map(data.answers, function(value, index){
      return value.votes;
    });

    var voters=$.map(data.voters, function(value, index){
      return value.ip;
    });


    $.getJSON('https://ipinfo.io', function(ipdata){
      if($.inArray(ipdata.ip, voters)>=0){
        voted=true;
      }
      if(!voted){
        createForm(data,options,votes,data.owner)
      }
      else{
        var all=votes.reduce(function(a, b) {return a + b;}, 0);
        if(all!=0){
          plot(data, votes, all);
        }
        else{
          document.getElementById("plot").innerHTML="No votes yet"
        }
      }
    });
  });
}


//submits form
$("form").submit(function(e) {
    e.preventDefault(); // Prevents the page from refreshing
    var $this = $(this);
      $.post(
          $this.attr("action"), // Gets the URL to sent the post to
          $this.serialize(),
          "json"
      )
      .done(function(){
        $('#vote')[0].reset();
        voted=true;
        getData(address);
    });
});



//plotting
function plot(data, votes, all){
  var dat=data.answers;

  var canvas=d3.select("#plot").append("svg")
    .attr("width", 1000)
    .attr("height", 1000);

  var tip=d3.select("#plot").append("div");
  var color = d3.scale.category20();

  var group= canvas.append("g")
    .attr("transform", "translate(500,200)");

  var r=200;
  var p=Math.PI *2;

  var arc=d3.svg.arc()
    .innerRadius(0)
    .outerRadius(r)

  var pie=d3.layout.pie()
    .value(function(d){return d.votes/all})
    .startAngle(0)
    .endAngle(p)
    .sort(null);

  var arcs=group.selectAll(".arc")
    .data(pie(dat))
    .enter()
    .append("g")
    .attr("class", "arc")

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", function(d,i){return color(i)})
    .transition()
      //.delay(function(d,i){return i*500;})
      .duration(500)
    .attrTween("d", function(d){
      var i=d3.interpolate(d.startAngle+0.1,d.endAngle);
      return function(t){
        d.endAngle=i(t);
        return arc(d);
      }
    });

  arcs.append("text")
    .attr("transform", function(d){return "translate("+arc.centroid(d) + ")";})
    .attr("text-anchor", "middle")
    .attr("font-size", "1.5em")
    .transition()
    .delay(500)
    .text(function(d){if(d.data.votes>0){
      if(d.endAngle-d.startAngle<1.57 && d.data.option.length>10){
        return d.data.option.slice(0,10)+"..."
      }
      else{
      return d.data.option;}}});

  arcs.on("mouseover", function(d){
    var p=d3.select(this);
    p.attr("class", "mouseover")
    tip.html("<span>"+ d.data.option + "</span> </br> <span>Votes: "+ d.data.votes + "</span>")
    tip.transition()
    .attr("class", "tooltip")
    .delay(200)
    .style("opacity", 0.8)
    .style("left", d3.event.pageX + 5 +"px")
    .style("top", d3.event.pageY -25+"px")
  });

  arcs.on("mouseout", function(d){
    var p=d3.select(this)
    p.attr("class", "mouseout")
    tip.transition()
    .delay(100)
    .style("opacity", 0)
  });

};
