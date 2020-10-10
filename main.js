var input_name = '';
var input_distance = 0;
var input_json = [];

var ratio_w = 0;
var ratio_h = 0;


var green_nodes = [];
var blue_nodes = [];


jQuery(document).ready(function ($) {

  ////////////// input event handler
  $(document).on('input', 'input#name', function () {
    input_name = $(this).val();
    draw();
  });
  $(document).on('input', 'input#distance', function () {
    if ($(this).val() > 9999999999) {
      alert("Distance can be bigger than 9999999999");
      $(this).val("");
    }

    input_distance = $(this).val();
    draw();
  });


  ////////////// redraw when window resize
  var canvas = document.getElementById('canvas');

  window.addEventListener('resize', resizeCanvas, false);


  resizeCanvas();



  //////////////For testing
  // test1();

});

function showFilename(file) {
  $("#filename_label").html("nihi");
}


function resizeCanvas() {

  const formHeight = 300;
  const containerPadding = 20 * 2;
  const widthTolerance = 100; //e.g. Icehouse Canyon has 100px width
  const heightTolerance = 100;
  canvas.width = $("div.container").innerWidth() - containerPadding;
  canvas.height = window.innerHeight - formHeight;

  var max_x = get_max_x();
  if (max_x)
    ratio_w = (canvas.width - widthTolerance) / max_x;

  var max_y = get_max_y();
  if (max_y)
    ratio_h = (canvas.height - heightTolerance) / max_y;

  draw();
}

function upload(e) {

  let reader = new FileReader();
  if (e.files[0]) {
    $('span#filename').text(e.files[0].name);
    reader.readAsText(e.files[0], "UTF-8");
    reader.onload = function (evt) {
      let fileString = evt.target.result;
      try {
        input_json = JSON.parse(fileString);
      } catch (e) {
        alert("Invalid Json format - " + e);
      }


      calculateShortDistance(input_json);
      resizeCanvas();


      console.log(input_json);
    }
  } else {
    input_json = [];
    resizeCanvas();
    $('input#name').val('');
    $('input#distance').val('');

  }

  e.value = '';
}


function get_max_x() {
  var max_x = 0;
  for (let index = 0; index < input_json.length; index++) {
    if (input_json[index].x > max_x) {
      max_x = input_json[index].x;
    }
  }
  return max_x;
}

function get_max_y() {
  var max_y = 0;
  for (let index = 0; index < input_json.length; index++) {
    if (input_json[index].y > max_y) {
      max_y = input_json[index].y;
    }
  }
  return max_y;
}


function draw_node(ctx, name, x, y, color) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "12px Comic Sans MS";
  ctx.fillStyle = color;

  ctx.fillText(name, x * ratio_w, y * ratio_h);
}

function draw_node_with_distance(ctx, name, x, y, color, distance) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "12px Comic Sans MS";
  ctx.fillStyle = color;

  ctx.fillText(name + "(" + distance.toFixed(1) + ")", x * ratio_w, y * ratio_h);
}



function draw() {

  try {
    //Step1. Clear
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    green_nodes = [];
    blue_nodes = [];

    //Step2. Draw green nodes
    for (let i = 0; i < input_json.length; i++) {
      if (input_json[i].name.includes(input_name)) {
        draw_node(ctx, input_json[i].name, input_json[i].x, input_json[i].y, 'green');
        green_nodes.push(i);

      }
    }

    //Step3. Set blue nodes buffer
    for (let index = 0; index < green_nodes.length; index++) {
      const green_node = green_nodes[index];
      for (let j = 0; j < input_json[green_node].distance.length; j++) {
        if (green_nodes.includes(j))
          continue;
        if (input_json[green_node].distance[j] <= input_distance && input_json[green_node].distance[j] != 0) {

          var found = false;
          for (let n = 0; n < blue_nodes.length; n++) {
            if (blue_nodes[n].index == j) {
              found = true;
              if (blue_nodes[n].distance > input_json[green_node].distance[j]) {
                blue_nodes[n].distance = input_json[green_node].distance[j];
              }
            }

          }
          if (!found) {
            var blueNode = new Object();
            blueNode.index = j;
            blueNode.distance = input_json[green_node].distance[j];
            blue_nodes.push(blueNode);
          }

        }

      }

    }

    //Step4. Draw blue nodes
    for (let i = 0; i < blue_nodes.length; i++) {
      const index = blue_nodes[i].index;
      const distance = blue_nodes[i].distance;
      draw_node_with_distance(ctx, input_json[index].name, input_json[index].x, input_json[index].y, 'blue', distance);

    }
  } catch (e) {
    alert("Invalid Json format - " + e);
  }




}





function calculateShortDistance(input_json) {

  try {

    const size = input_json.length + 1;

    const maxInt = 9999999999; // infinity

    /* Cost Matrix
     * 2-D array representing the distances between all the vertices in the map
     * For example, the distance (cost) from v1 --> v2 = 50; v1 --> v3 = 20; v1 --> v4 does not exist, and so on..
     * An infinite value in the cost matrix (maxInt) means there does not exist a path between these 2 vertices.
     * The zero based indexes of the cost matrix are null since we have only 5 vertices; v1, v2, v3, v4, v5 (there is no v0 on the map).
     */
    const C = [];


    for (let i = 1; i < size; i++) {
      C[i] = [];
      C[i].push(null);
      for (let j = 1; j < size; j++) {
        C[i][j] = maxInt;
      }
    }


    for (let i = 1; i < size; i++) {

      for (let index = 0; index < input_json[i - 1].connections.length; index++) {
        const connection = input_json[i - 1].connections[index];
        let connection_index = get_connection_index(connection);
        if (connection_index < 0) {
          alert("Invalid input: please check the connections");
        } else {
          var x1 = input_json[i - 1].x;
          var y1 = input_json[i - 1].y;
          var x2 = input_json[connection_index].x;
          var y2 = input_json[connection_index].y;
          var a = x1 - x2;
          var b = y1 - y2;
          var distance = Math.sqrt(a * a + b * b);
          C[i][connection_index + 1] = distance;
        }

      }

      function get_connection_index(item) {
        for (let index = 0; index < input_json.length; index++) {
          const element = input_json[index];
          if (element.name == item)
            return index;
        }
        return -1;
      }

    }



    /* Vertex Data
     * distance: integer from cost matrix representing the distance from previous vertex to this vertex
     * path: integer representing the number of the vertex preceding this one in the shortest path
     * visited: boolean representing whether or not this vertex has been visited during the algorithm
     */
    function Vertex(distance, path, visited) {
      this.dist = distance;
      this.path = path;
      this.visited = visited;
    };

    /* 2-D aray of vertex data
     */
    let T = [];

    // build T with default vertex data
    for (var i = 1; i < size; i++) {
      T[i] = [];
      for (var j = 1; j < size; j++) {
        T[i][j] = new Vertex(maxInt, 0, false);
      }
    }

    // Dijkstra's algorithm to calculate the shortest paths between all nodes in the map
    function dijkstra() {
      for (var source = 1; source < size; source++) { // give each vertex the chance to be the "source" node
        T[source][source].dist = 0; // distance from source to itself is of course 0

        let v, nextV;
        for (var i = 1; i < size - 1; i++) {
          // v = not yet visited node with the minimum distance (haven't gone thru yet)
          // always start with v as the source vertex
          v = i === 1 ? source : nextV;

          // mark v as visited
          T[source][v].visited = true;

          // for each w adjacent to v
          nextV = null;
          for (var w = 1; w < size; w++) {
            // if (w is not visited)
            if (!T[source][w].visited) {
              // adjust the shortest distance from source to w
              // if going through v is shorter, set .path to v
              if (T[source][v].dist + C[v][w] < T[source][w].dist) {
                T[source][w].dist = T[source][v].dist + C[v][w];
                T[source][w].path = v;
              }

              // find what our next V will be
              if (nextV == null) { // if (our next v has not yet been set)
                nextV = w; // set our next v to the first non-visited vertex
              } else {
                // if (the next non-visited vertex distance is less than the current chosen next v's distance)
                if (T[source][w].dist < T[source][nextV].dist) {
                  nextV = w; // then change our next v to this new vertex (because it has a shorter path, and it is non-visited)
                }
              }
            }
          }
        }
      }
    }

    dijkstra();

    test2(size, maxInt, T);


    for (let index = 0; index < input_json.length; index++) {
      input_json[index].distance = [];

      for (var j = 1; j < size; j++) {
        input_json[index].distance.push(T[index + 1][j].dist);
      }
    }

  } catch (e) {
    alert("Invalid Json format - " + e);
  }



  return input_json;
}

/***
 * _________________Testing function
 */

function test1() {
  let fileString = "[\n  {\n    \"name\": \"Buckingham\",\n    \"x\": 36,\n    \"y\": 34,\n    \"connections\": [\"Kings Point\", \"Icehouse Canyon\", \"Newtown\"]\n  },\n\n  {\n    \"name\": \"Kings Point\",\n    \"x\": 26,\n    \"y\": 76,\n    \"connections\": [\"Newtown\"]\n  },\n  {\n    \"name\": \"Newtown\",\n    \"x\": 34,\n    \"y\": 93,\n    \"connections\": [\"Kings Point\", \"Townsend\"]\n  },\n  {\n    \"name\": \"Icehouse Canyon\",\n    \"x\": 17,\n    \"y\": 21,\n    \"connections\": [\"Bucks Lake\", \"Townsend\", \"Buckingham\"]\n  },\n  {\n    \"name\": \"Bucks Lake\",\n    \"x\": 10,\n    \"y\": 14,\n    \"connections\": [\"Kealakekua\", \"Buckingham\"]\n  },\n  {\n    \"name\": \"Kealakekua\",\n    \"x\": 41,\n    \"y\": 24,\n    \"connections\": [\"Buckingham\", \"Icehouse Canyon\"]\n  },\n  {\n    \"name\": \"Venice\",\n    \"x\": 11,\n    \"y\": 37,\n    \"connections\": [\"Townsend\", \"Buckingham\", \"Zurich\"]\n  },\n  {\n    \"name\": \"Townsend\",\n    \"x\": 10,\n    \"y\": 36,\n    \"connections\": [\"Bucks Lake\"]\n  },\n  {\n    \"name\": \"Zurich\",\n    \"x\": 23,\n    \"y\": 44,\n    \"connections\": [\"Newtown\"]\n  }\n]\n";

  input_json = JSON.parse(fileString);

  calculateShortDistance(input_json);
  resizeCanvas();
  console.log(input_json);
}


function test2(size, maxInt, T) {
  let shortestPathString = '';

  // run through entire matrix and print out all shortest paths from all sources
  for (var i = 1; i < size; i++) {
    for (var j = 1; j < size; j++) {
      getShortestPath(i, j);
    }
  }

  function getShortestPath(source, destination, shortestPath) {
    shortestPathString = 'Shortest path from ' + source + ' to ' + destination + ': ';
    if (T[source][destination].dist == maxInt) {
      shortestPathString += 'N/A';
    } else {
      getEachPathVertex(source, destination);
      shortestPathString += ' ' + destination;
    }

    shortestPathString += '.  The distance is: ' + T[source][destination].dist.toFixed(1);
    console.log(shortestPathString);
  }

  function getEachPathVertex(source, destination) {
    if (destination != source && destination > 0) {
      getEachPathVertex(source, T[source][destination].path); // recursively call itself with the new path
      shortestPathString += ' ' + T[source][destination].path; // append the path to the global print string
    }
  }
}