// Here You can type your custom JavaScript...
jQuery(function() {
  let profile = {};

  let getTitle = () => {
    return jQuery('section main article header h1').text();
  }
  let is_profile = function() {
      let test = getTitle();
      return (test.length > 0);
  }
  let is_photo = function() {
      let test = getUsername();
      return (test.length > 0);
  }
  let getUsername = function( ) {
      return jQuery('article header div div div a').text();
  }

  let addListeners = () => {
      jQuery('#ng_prospector .scrape').on('click', scrapePage);
      // jQuery('body main article > div:nth(1) > a').on('click', () => { console.log('clicked!'); });
      // jQuery(document).on('scroll', scrollHandler);
  }

  /**
   * scrapePage
   *
   * Scrape the photos on the page
   */
  let scrapePage = () => {
    // Determine what kind of photo/page we're looking at
    let scrapeType = getPageType();

    if (scrapeType === 'photo') {
      let user = getUsername();
      let profile = getProfileByUser( user );
    }
    else if (scrapeType === 'hashtag') {
      return scrapeHashtag();
    }
    else if (scrapeType === 'profile') {
      return scrapeProfile();
    }
  }
  let scrapeHashtag = (unformatted = [], formatted = []) => {
    unformatted = jQuery('._cmdpi ._70iju');

    unformatted.each((i, photo) => {
      // First 9 are ads
      if (i>8) {
        // Instead, we want the most recent
        let photoUrl = jQuery(photo).find('div > a').attr('href').split("?tagged=")[0];
        formatted.push( photoUrl );
        // console.log(i, photoUrl );
      }
    });

    // Scrape this list of photo urlsa
    scrapeUsernamesFromPhotoUrls(formatted);
  }


  /**
   * scrapeUsernamesFromPhotoUrls
   *
   * @param urls Array of photo urls to scrape
   * @param usernames Array scraped usernames
   */
  let scrapeUsernamesFromPhotoUrls = ( urls = [], usernames = []) => {
    let url = 'https://www.instagram.com' + urls.shift();

    request_args = {
      url: url,
      success: (result) => {
        // Dig, dig, dig...
        let jsonElement = '';
        jsonElement = result.split('window._sharedData = ')[1];
        jsonElement = jsonElement.split(';</script>')[0];
        jsonElement = JSON.parse(jsonElement);

        let username = jsonElement.entry_data.PostPage[0].graphql.shortcode_media.owner.username;

        console.log('(%d/%d) Getting owner of: %s ... %s', usernames.length, (urls.length+usernames.length), url, username);
        usernames.push ( username );

        if (urls.length) {
          // console.log('usernames scraped: %d (%d to go)', usernames.length, urls.length);
          setTimeout(function() { scrapeUsernamesFromPhotoUrls(urls, usernames); }, 1000);
        }
      },
      error: () => { return false; }
    };

    $.ajax( request_args );
  }


  /**
   * getProfileByUser
   *
   * @param username String Username to scrape
   */
  let getProfileByUser = ( username ) => {
    let url = "https://www.instagram.com/{{username}}/?__a=1".replace("{{username}}", username ),
      request_args = {
        url: url,
        success: (result) => {
          result = result.user;

          let fname = result.full_name.split(' ')[0],
            lname = result.full_name.replace(fname, '').trim(),
            followers = result.followed_by.count,
            following = result.follows.count,
            profile = 'https://instagram.com/' + username,
            bio = '"' + result.biography + '"',
            profile_url = (result.external_url) ? result.external_url : '',
            id = result.id,
            userArray = [username, fname, lname, '', followers, following, profile, bio, profile_url, id];

          return userArray;
        },
        error: () => { return false; },
        dataType: 'json'
      };

    $.ajax( request_args );
  }


  /**
   * getPageType
   *
   */
  let getPageType = () => {
      let pageType = false;
      let isPhoto = is_photo();
      let isProfile = is_profile();
      let isHashtag = jQuery('section main article header h1').text();
      if ( is_photo() ) {
          pageType = 'photo';
      }
      else if ( is_profile() ) {
        let title = getTitle();

        console.log(title);
        let isHashtag = title.includes('#');

        pageType = ( isHashtag ) ? 'hashtag' : 'profile';
      }
      return pageType;
  }


  /**
   * init
   *
   * Bootstrap our scraper plugin
   */
  let init = function() {

    let cachebuster = new Date();
    cachebuster = cachebuster.getTime();

    // Inject styles
    jQuery('<link href="//loc.insta.loc/prospector.css?'+ cachebuster +'" rel="stylesheet"></link>').appendTo('head');

    // Inject dom elements
    jQuery('<div href="#" id="ng_prospector"><a href="#" class="btn scrape">Scrape <span class="count"></span></a></div>').appendTo('body');

    // Inject scripts
    // jQuery('<script src="/loc.insta.loc/lib/clipboard.min.js"></script>').appendTo('body');

    // Add Event Listeners
    addListeners();
  }

  // All aboard!
  init();

});
