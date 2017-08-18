/**
 *
 *
 */
jQuery(() => {
  // let profile = {};
  let scrapeSource = '';


  /**
   * init
   *
   * Bootstrap our scraper plugin
   */
  let init = () => {
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


  /**
   * addListeners
   *
   * Add various needed Event Listeners
   */
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


  /**
   * scrapeHashtag
   *
   * @param unformatted Array should be empty initially
   * @param formatted Array should be empty initially
   */
  let scrapeHashtag = (unformatted = [], formatted = []) => {
    unformatted = jQuery('._cmdpi ._70iju div > a');

    unformatted.each((i, photo) => {
      if (i>8) { // Skip the first 9 (ads), we just want the "most recent"
        let photoUrl = jQuery(photo).attr('href').split("?tagged=")[0];
        formatted.push( photoUrl );
      }
    });

    // Scrape this list of photo urls
    if (formatted.length) {
      scrapeUsernamesFromPhotoUrls(formatted);
    }
    else {
      console.error("Ack! Didn't find any photos");
      // console.log("%s unformatted photo items%s", (unformatted.length) ? "Found "+unformatted.length : "Didn't find any", (unformatted.length) ? '' : ', either' );
    }
  }


  /**
   * scrapeUsernamesFromPhotoUrls
   *
   * @param urls Array of photo urls to scrape
   * @param usernames Array scraped usernames
   */
  let scrapeUsernamesFromPhotoUrls = ( urls = [], usernames = []) => {
    // Setup request
    let url = 'https://www.instagram.com' + urls.shift(),
      request_args = {
        url: url,
        success: (result) => {
          // Dig, dig, dig...
          let jsonElement = '';
          jsonElement = result.split('window._sharedData = ')[1];
          jsonElement = jsonElement.split(';</script>')[0];
          jsonElement = JSON.parse(jsonElement); // We've carved out a JSON object

          let username = jsonElement.entry_data.PostPage[0].graphql.shortcode_media.owner.username;

          console.log('(%d/%d) Getting owner of: %s ... %s', usernames.length+1, (urls.length+usernames.length)+1, url, username);
          usernames.push ( username );

          if (urls.length) {
            // console.log('usernames scraped: %d (%d to go)', usernames.length, urls.length);
            setTimeout(() => { scrapeUsernamesFromPhotoUrls(urls, usernames); }, 900);
          }
          else {
            // usernames = [].concat.apply([], usernames); // flatten array
            console.log('Deduplicating username list from %d usernames', usernames.length);
            usernames = dedupe([].concat(usernames)); // deduplicate
            console.log('Deduplicated username list to %d usernames', usernames.length);
            scrapeUserProfiles( usernames );
          }
        },
        error: () => { return false; }
      };

    // Send request
    $.ajax( request_args );
  }


  /**
   * scrapeUserProfiles
   *
   * @param usernames Array Usernames to scrape
   */
  let scrapeUserProfiles = ( usernames = [], profiles = [] ) => {
    // Setup request
    let username = usernames.shift(),
      url = "https://www.instagram.com/{{username}}/?__a=1".replace("{{username}}", username ),
      request_args = {
        url: url,
        success: (result) => {
          result = result.user;

          let fullname = result.full_name,
            fname = (fullname) ? (fullname.split(' ').length > 0) ? fullname.split(' ')[0] : '' : '',
            lname = (fullname) ? (fullname.split(' ').length > 1) ? fullname.replace(fname, '').trim() : '' : '',
            followers = (result.followed_by.count) ? result.followed_by.count : 0,
            following = (result.follows.count) ? result.follows.count : 0,
            profile_url1 = 'https://www.instagram.com/' + username,
            // bio = (result.biography) ? '"' + result.biography.replace(/[^\x20-\x7E]/gmi, "") + '"' : '""', // strips emojis
            bio = (result.biography) ? '"' + result.biography.replace(/(\r\n|\n|\r)/gm,"") + '"' : '""',
            external_url = (result.external_url) ? result.external_url : '', // @TODO we shouldn't be callign two profile_urls
            id = (result.id) ? result.id : 0,
            profile = [username, fname, lname, '', followers, following, profile_url1, bio, external_url, id];

          console.log('(%d/%d) Getting profile of: %s ... OK!', profiles.length+1, (usernames.length+profiles.length)+1, username);
          // console.log(bio);
          profiles.push( profile );

          if (usernames.length) {
            setTimeout(() => { scrapeUserProfiles(usernames, profiles); }, 900);
          }
          else {
            outputScrape( profiles );
          }
        },
        error: () => { return false; },
        dataType: 'json'
      };

    $.ajax( request_args );
  }

  /**
   * outputScrape
   *
   * @param profiles Array of scraped profiles
   */
  let outputScrape = ( profiles = [] ) => {
    let myWindow,
      scrapeDate = new Date(),
      scrapeData = "",
      source = getTitle();

    // Build output string
    // @TODO Load this in as html from external file, then split it and build profiles in
    scrapeData += '<html><head>';
    scrapeData += '<title>' + source + ' scrape results </title>';
    scrapeData += '<link href="//loc.insta.loc/prospector-out.css" rel="stylesheet"></link>';
    scrapeData += '</head><body id="out">';
    scrapeData += '<h1>' + source + ' scrape results</h1>';
    scrapeData += '<nav><a href="#" id="copy-to-clipboard" class="btn">Copy to clipboard</a><a href="#" id="export-csv" class="btn">Export as CSV</a></nav>';
    scrapeData += '<textarea>';
    profiles.map( (profile) => {
      scrapeData += profile.join(",") + "\r";
    });
    scrapeData += '</textarea>';
    scrapeData += '<script>let scrape = {source: "'+ source + '"};</script>';
    scrapeData += '<script src="//code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>';
    scrapeData += '<script src="//loc.insta.loc/prospector-out.js"></script>';
    scrapeData += '</body></html>';

    // Open window
    scrapeId = 'scrape' + scrapeDate.getTime();
    myWindow = window.open( scrapeId, "_blank" );
    myWindow.document.write( scrapeData );
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
            profile_url1 = 'https://instagram.com/' + username,
            bio = '"' + result.biography + '"',
            external_url = (result.external_url) ? result.external_url : '', // @TODO we shouldn't be callign two profile_urls
            id = result.id,
            profile = [username, fname, lname, '', followers, following, profile_url1, bio, external_url, id];


          return profile;
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
   * Boolean functions
   *
   */
  let is_profile = () => {
    let test = getTitle();
    return (test.length > 0);
  }
  let is_photo = () => {
    let test = getUsername();
    return (test.length > 0);
  }


  /**
   * Getters
   *
   */
  let getTitle = () => {
    return jQuery('section main article header h1').text();
  }
  let getUsername = () => {
    return jQuery('article header div div div a').text();
  }

  /**
   * dedupe
   *
   * De-duplicate items in array
   *
   * @param arr Array to dedupe
   */
  var dedupe = (arr) => {
    return arr.filter((elem, pos, arr2) => {
      return arr2.indexOf(elem) == pos;
    });
  }


  // All aboard!
  init();

});
