// set initial settings
var prefix = "gitlo-";

// suggest branch name on labels
var isSuggestLabelBranchTypeActive = localStorage.getItem(prefix + 'suggest-label-branch-type-active');
if(isSuggestLabelBranchTypeActive === null) {
  var defaultSuggestLabelActive = true;
  localStorage.setItem(prefix + 'suggest-label-branch-type-active', defaultSuggestLabelActive);
  isSuggestLabelBranchTypeActive = defaultSuggestLabelActive;
}

// labels to convert
var suggestedLabels = localStorage.getItem(prefix + 'suggested-labels');
if(suggestedLabels === null || suggestedLabels === 'undefined') {
  var defaultSuggestedLabels = [
    {
      "orig": "feature",
      "sugg": "feature"
    },
    {
      "orig": "bug",
      "sugg": "fix"
    },
    {
      "orig": "chore",
      "sugg": "chore"
    },
    {
      "orig": "hotfix",
      "sugg": "hotfix"
    }
  ];
  localStorage.setItem(prefix + 'suggested-labels', JSON.stringify(defaultSuggestedLabels));
  suggestedLabels = defaultSuggestedLabels;
} else {
  suggestedLabels = JSON.parse(suggestedLabels);
}

// Add git hub command for using issue as PR active
var isHubCommandActive = localStorage.getItem(prefix + 'hub-command-active');
if(isHubCommandActive === null) {
  var defaultIsHubCommandActive = true;
  localStorage.setItem(prefix + 'hub-command-active', defaultIsHubCommandActive);
  isHubCommandActive = defaultIsHubCommandActive;
}

// Add git hub command for using issue as PR active
var hubCommentBranch = localStorage.getItem(prefix + 'hub-command-default-branch');
if(hubCommentBranch === null) {
  var hubCommandDefaultBranch = 'develop';
  localStorage.setItem(prefix + 'hub-command-default-branch', hubCommandDefaultBranch);
  isHubCommandActive = hubCommandDefaultBranch;
}

var maxBranchNameLength = localStorage.getItem(prefix + 'max-branch-name-length');
if(maxBranchNameLength === null) {
  var defaultMaxBranchNameLength = 50;
  localStorage.setItem(prefix + 'max-branch-name-length', defaultMaxBranchNameLength);
  maxBranchNameLength = defaultMaxBranchNameLength;
}

var cardClasses = ".issue-card h5 > a, .project-card h5 > a";
var urlBase = "https://github.com";

var cardModal = '<div class="modal" style="display: none"></div>';
var wasDoubleClicked = false;
var currentHash = false;
var gitHubCommand = "hub pull-request -i [ticketId] -b [ORIGINAL_AUTHOR]:[ORIGINAL_AUTHOR_BRANCH] -h [FROM_USER]:[FROM_BRANCH]";

function getCardInformation(url) {
  var card = $('.modal');
  $.ajax(urlBase+ url).done(function(result){
    if(wasDoubleClicked) return false;
    card.empty();
    var content = $(result).find("[type='text/css'], .issues-listing");
    content.find(".tabnav").remove();
    content.appendTo(card);
    if(isSuggestLabelBranchTypeActive) {
      appendBranchName();
    }

    if(isHubCommandActive) {
      appendGitHubCommand();
    }

    card.modal();
  });
}

function getBranchNamePrefix() {
  var suggestedName = '';
  if(isSuggestLabelBranchTypeActive) {
    $('.labels').find('a').each(function () {
      var name = $(this).text().toLowerCase();
      suggestedLabels.forEach(function (item) {
        if (item.orig === name) {
          suggestedName = item.sugg;
        }
      });
    });
    return suggestedName + '/';
  }
  return suggestedName;
}

function getOriginalAuthor() {
  return window.location.pathname.split('/')[1];
}

function getGitHubCommand() {
  return '<p><strong>Hub command: </strong><input style="width: 100%" type="text" value="'
    + gitHubCommand.
    replace('[ticketId]', getTicketNumber()).
    replace('[ORIGINAL_AUTHOR]', getOriginalAuthor()).
    replace('[ORIGINAL_AUTHOR_BRANCH]', 'develop').
    replace('[FROM_USER]', getOriginalAuthor()).
    replace('[FROM_BRANCH]', getBranchNamePrefix()+ getBranchName())
    + '"></p>';
}

function appendGitHubCommand() {
  $(getGitHubCommand()).appendTo('.flex-table-item-primary');
}

function urlHasHash() {
  return (window.location.hash)?true:false;
}

function getUrlHash() {
  return window.location.hash;
}

function getTicketNumber() {
  return getUrlHash().replace('#', '');
}

function getBranchName() {
  if(urlHasHash())
    return 'g' + getTicketNumber() + '-' + $('.js-issue-title').text().trim().toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-').substr(0, maxBranchNameLength).replace(/-+$/, "");
  else
    return false;
}

function appendBranchName() {
  var branchName = '<p><strong>Branch: </strong><input style="width: 100%" type="text" value="' + getBranchNamePrefix() + getBranchName() + '"></p>';
  if(branchName !== false) {
    $(branchName).appendTo('.flex-table-item-primary');
  }
}

function triggerCard() {
  var withCardId = $("div[id='"+getTicketNumber()+"'] > h5 > a");
  var withTicketId = $("a[href$='"+getTicketNumber()+"']");

  if(withTicketId.length > 0 || withCardId.length > 0) {
    withCardId.trigger('click');
    withTicketId.trigger('click');
  } else {
    setTimeout(triggerCard, 100);
  }
}

function removeHash () {
  history.pushState("", document.title, window.location.pathname + window.location.search);
}

$(document).ready(function(){
  $(cardModal).appendTo('body');
  var body = $('body');
  body.on('click', cardClasses, function(event){
    event.preventDefault();
    var url = $(this).attr('href');
    var urlParts = url.split('/');
    var ticketId = urlParts[urlParts.length - 1];
    window.location.href = '#'+ticketId;
    currentHash = getUrlHash();

    getCardInformation(url);
  });
  body.on('dblclick', cardClasses, function(event){
    wasDoubleClicked = true;
    event.preventDefault();
    window.location.href = $(this).attr('href');
  });

  body.on('click', '.close-modal', function(){
    removeHash();
  });
  if(urlHasHash()) {
    triggerCard();
  }

  $(window).on('hashchange', function() {
    if(currentHash !== false && currentHash !== window.location.hash) {
      triggerCard();
    }
  });
});