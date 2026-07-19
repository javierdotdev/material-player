var track = new Ticker({
  element: '.complete',
  start: 60,
  time: 526
});

$('.pause').on('click', function () {
  $(this).children('.fa')
    .toggleClass('fa-pause')
    .toggleClass('fa-play');
  
  if (track.paused) {
    track.play();
  } else {
    track.pause();
  }
});

$('.vol-down, .vol-up').on('click', function () {
  var change,
      pos = $('.level').width(),
      width = $('.vol-bar').width();
  
  if ($(this).hasClass('vol-down')) {
    change = -10;
  } else if ($(this).hasClass('vol-up')) {
    change = 10;
  }
  
  if (pos + change < 0) {
    $('.level').width(0);
  } else if (pos + change > width) {
    $('.level').width(width);
  } else {
    $('.level').width(pos + change);
  }
});

$('.vol-bar').on('click', function (event) {
  $('.level').width(event.offsetX);
});