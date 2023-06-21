var container = $("#unity-container");
var canvas = $("#unity-canvas");
var loadingBar = $("#unity-loading-bar");
var progressBarFull = $("#unity-progress-bar-full");
var fullscreenButton = $("#unity-fullscreen-button");
var warningBanner = $("#unity-warning");
var helpSection = $("#help");
var playButton = $('#play-button')

// Shows a temporary message banner/ribbon for a few seconds, or
// a permanent error message on top of the canvas if type=='error'.
// If type=='warning', a yellow highlight color is used.
// Modify or remove this function to customize the visually presented
// way that non-critical warnings and error messages are presented to the
// user.
function unityShowBanner(msg, type) {
  function updateBannerVisibility() {
    warningBanner.css("display", warningBanner.length ? 'block' : 'none');
  }
  let warnDiv = $(`<div>${msg}</div>`);
  warningBanner.append(warnDiv);
  if (type == 'error') warnDiv.css({'background': 'red', 'padding': '10px'});
  else {
    if (type == 'warning') warnDiv.css({'background': 'yellow', 'padding': '10px'});
    setTimeout(function() {
      warnDiv.remove();
      updateBannerVisibility();
    }, 5000);
  }
  updateBannerVisibility();
}

var buildUrl = "Build";
var loaderUrl = buildUrl + "/dd1demo.loader.js";
var config = {
  dataUrl: buildUrl + "/dd1demo.data.unityweb",
  frameworkUrl: buildUrl + "/dd1demo.framework.js.unityweb",
  codeUrl: buildUrl + "/dd1demo.wasm.unityweb",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "EKA2L1",
  productName: "Dirk Dagger And The Fallen Idol Unity",
  productVersion: "1.7.0",
  showBanner: unityShowBanner,
};

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Mobile device style: fill the whole browser client area with the game canvas:
  $("head").append($('<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes">'));

  container.attr("class", "unity-mobile");
  canvas.attr("class", "unity-mobile");

  helpSection.hide();
  container.hide();

  playButton.show();
} else {
  // Desktop style: Render the game canvas in a window that can be maximized to fullscreen:

  canvas.width("1024px");
  canvas.height("576px");
  
  playButton.hide();
  container.show();
}

loadingBar.show();

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
  var unityInstanceGlob = null;
  var fullScreenRequestPending = false;
  var quitRequested = false;
  
  // Very unreliable, just make our own var
  if (isMobile) {
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', () => {
      if (fullScreenRequestPending) {
        fullScreenRequestPending = false;
        screen.orientation.lock('landscape-primary');

        playButton.hide();
        container.show();

        if (quitRequested) {
          quitRequested = false;
        } else {
          startGame();
        }
      } else {
        quitRequested = true;
        quitGame();
      }
    });
  }
  
  let quitGame = () => {
    let showPlayInterface = () => {          
      container.hide();
      playButton.show();
    };

    if (!unityInstanceGlob) {
      showPlayInterface();
      return;
    }
    
    quitRequested = false;

    unityInstanceGlob.Quit().then(() => {
      showPlayInterface();
    });
    
    unityInstanceGlob = null;
  };

  let startGame = () => {
      progressBarFull.width(0);
      loadingBar.show();
      
      if (isMobile) {
        canvas.hide();
      }

      createUnityInstance(canvas.get(0), config, (progress) => {
        progressBarFull.width(100 * progress + "%");
      }).then((unityInstance) => {
        if (quitRequested) {
          unityInstanceGlob = unityInstance;
          quitGame();
          
          return;
        }
        if (isMobile) {
          canvas.show();
        }
        loadingBar.hide();
        if (isMobile) {
          unityInstance.SetFullscreen(1);
          unityInstanceGlob = unityInstance;
        } else {
          fullscreenButton.click(() => {
            unityInstance.SetFullscreen(1);
          });
        }
      }).catch((message) => {
        alert(message);
      });
  };
  if (isMobile) {
    playButton.click(() => {
      let containerRaw = container.get(0);
      let fullscreenFunc = undefined;
      if(containerRaw.requestFullScreen)
          fullscreenFunc = containerRaw.requestFullScreen.bind(containerRaw);
      else if(containerRaw.webkitRequestFullScreen)
          fullscreenFunc = containerRaw.webkitRequestFullScreen.bind(containerRaw);
      else if(containerRaw.mozRequestFullScreen)
          fullscreenFunc = containerRaw.mozRequestFullScreen.bind(containerRaw);

      fullScreenRequestPending = true;
      fullscreenFunc();
    });
  } else {
    startGame();
  }
};
document.body.appendChild(script);