/**
*
*
*/
jQuery(() => {
  /**
  * Instantiate variables
  *
  */
  let dashboardShowing = false,
  currentState = 'home',
  // initialized = false,
  currentItemsOnPage = 0,
  prospecting = false,
  profiles = [],
  preferences = JSON.parse(sessionStorage.getItem('ng_prospector_preferences')),
  defaultPreferences = {
    delay: 100,
    includeHeaders: true,
    outputFields: ['username', 'fname', 'lname', 'blank', 'followers', 'following', 'profile_url', 'bio', 'external_url', 'id']
  };

  /**
  * SETUP DOM VARIABLES
  *
  * This is important to us, because we don't know when Instagram is going to change their
  * uglified/compiled css classes. When it happens, we need to be able to quickly update
  * the extension.
  */

  // Instantiate app-level public variables (empty)
  let prospectBtn,
  exportBtn,
  homeLink,
  outputLink,
  preferencesLink,
  outputContent,
  homePane,
  outputPane,
  preferencesPane,

  // Grab Instagram's DOM elements
  ig_items_selector_path = '._70iju div > a',
  ig_posts_popular = jQuery('._21z45'),
  ig_posts_recent = jQuery('._cmdpi:eq(1)'),
  ig_nav_primary = jQuery('.logged-in nav._68u16 div._5rnaq ._qlijk, .not-logged-in nav._68u16 div._5rnaq ._bvwt0'),
  ig_main_content = jQuery('main._8fi2q'),

  // Grab Prospector's DOM elements
  prospectorIcon = jQuery('<div class="_b28md"><a class="_8scx2 _gvoze ng_prospector" href="#">Add Prospects</a></div>'),
  dashboard = jQuery('<div id="ng_dashboard" class="home hidden no-scroll"></div>');

  /**
  * init
  *
  * Bootstrap our scraper plugin
  */
  let init = () => {
    console.log( 'Initializing Prospector...' );

    // Setup default preferences where needed.
    preferences = jQuery.extend(defaultPreferences, preferences);

    // Populate our empty Dashboard
    let dashboardTemplate = getDashboardTemplate(),
    currentItems = getPageItems();
    dashboard.hide().append( dashboardTemplate ); // @TODO: Move this hide to CSS

    // Grab various nav items and buttons
    homeLink = dashboard.find('.nav .home');
    outputLink = dashboard.find('.nav .output');
    preferencesLink = dashboard.find('.nav .preferences');
    prospectBtn = dashboard.find('.btn-prospect');
    exportBtn = dashboard.find('.btn-export');

    // Grab various DOM objects
    outputPane = dashboard.find('.output');
    preferencesPane = dashboard.find('.preferences');
    homePane = dashboard.find('.home');
    outputContent = outputPane.find('#out');

    updateDashboard([{
      type:'home',
      count: currentItems.length
    }]);

    // Attach our functionality
    ig_nav_primary.prepend(prospectorIcon);
    console.log('Attempted to add prospector (%s) icon to nav (%s)', prospectorIcon.length?'OK':'ERR', ig_nav_primary.length?'OK':'ERR' );
    ig_main_content.prepend(dashboard);
    console.log('Attempted to add dashboard (%s) above main content (%s)', dashboard.length?'OK':'ERR', ig_main_content.length?'OK':'ERR' );

    // Add Event Listeners
    addListeners();
  }


  /**
   * Get dashboard template
   *
   * @return String of HTML
   */
  let getDashboardTemplate = () => {
    let isChecked = ( preferences.includeHeaders ) ? 'checked' : '';

    return '' +
    '<div class="sidebar">' +
      '<ul class="nav">' +
        '<li><a href="#" class="home">Home</a></li>' +
        '<li><a href="#" class="output">Output</a></li>' +
        '<li><a href="#" class="preferences">Preferences</a></li>' +
      '</ul>' +
      '<ul class="actions">' +
        '<li><a href="#" class="btn btn-prospect">Start 👉🏻</a></li>' +
        '<li><a href="#" class="btn btn-export">Export</a></li>' +
      '</ul>' +
    '</div>' +
    '<div class="main">' +
      '<div class="home">' +
        '<h1 class="message">I see <span class="count">0</span> yummy accounts to look into. Feed me! 🍕🍔</h1>' +
      '</div>' +
      '<div class="output">' +
        // '<textarea id="out"></textarea>' +
        '<p class="idle">Currently <strong>idle</strong>.</p>' +
        '<p class="remaining">Currently prospecting <span class="phase">username</span> <em class="username"></em> (<span class="count">0</span> remaining)</p>' +
        '<table id="out"></table>' +
      '</div>' +
      '<div class="preferences">' +
        '<label for="delay">Delay: <input type="text" class="delay" name="delay" value="' + preferences.delay + '" placeholder="Delay in milliseconds" /> ms</label>' +
        '<label for="include-header"><input type="checkbox" name="include-header" class="include-header" checked="'+ isChecked +'" /> Include headers in export?</label>' +
        '<input type="text" name="output-fields" class="output-fields" value="' +isChecked + '" />' +
        '<label for="output-fields" class="output-fields-label">Options are: <strong>id</strong>, <strong>fullname</strong>, <strong>fname</strong>, <strong>lname</strong>, <strong>followers</strong>, <strong>following</strong>, <strong>profile_pic_url</strong>, <strong>profile_pic_url_hd</strong>, <strong>profile_url</strong>, <strong>bio</strong>, <strong>external_url</strong>, <strong>post_count</strong>, <strong>followed_by_user</strong>, <strong>follows_viewer</strong>, <strong>is_private</strong>, <strong>is_verified</strong>, <strong>blocked_by_viewer</strong>, <strong>has_blocked_viewer</strong> or <strong>blank</strong> (to insert an empty value), separated by comma.</label>' +
      '</div>' +
    '</div>';
  }


  /**
  * Find hashtag photos items
  *
  */
  let updateDashboard = ( data = [] ) => {
    // console.log(data.length);

    if (data.length) {
      // console.log("Updating the Dashboard (%d panes)", data.length);

      // Report funny business.
      if (data.length > 3) {
        console.error('ACK! There are more than 3 updates to the Dashboard!');
        return false;
      }

      // Otherwise we iterate through panes to update
      let i=0,
      until=data.length;

      for (;i<until; i=i+1) {
        let pane = data[i];

        // console.log('Updating pane... %s!', pane.type);

        /*
         * Update home pane
         *
         */
        if (pane.type === 'home') {
          if (pane.count) {
            homePane.find('.count')[0].innerHTML = pane.count;
          }
        }

        /*
         * Update output pane
         *
         */
        if (pane.type === 'output') {
          // console.log("Getting elements... Phase (%d), username (%d), remaining (%d), profile (%d)", outputPane.find('.phase').length, outputPane.find('.username').length, outputPane.find('.count').length, outputContent.length);
          // console.log("Getting values... found %d with %d remaining. %d should be %d", pane.count, (pane.countTotal-pane.count), pane.count+(pane.countTotal-pane.count), pane.countTotal);

          // Phase
          if (pane.phase) {
            outputPane.find('.phase')[0].innerHTML = pane.phase;

          }
          // Username
          if (pane.username) {
            outputPane.find('.username')[0].innerHTML = "'" + pane.username + "'";
          }
          // Remaining
          if (pane.count) {
            outputPane.find('.count')[0].innerHTML = (pane.countTotal - pane.count);
          }

          if (pane.profile) {
            let profile = pane.profile;
            let rowClass = (outputContent.children().length%2)?'even':'odd';
            let profileHtml = '' +
            '<tr class="'+rowClass+'">' +
              '<td class="prospect-profile-pic"><a href="'+profile.profile_url+'" target="_blank"><img src="'+ profile.profile_pic_url +'" class="prospect-pic" alt="'+profile.username+'" /></a></td>' +
              '<td class="prospect-username"><a href="'+profile.profile_url+'" target="_blank">@'+profile.username+'<br />('+ profile.fullname +')</a></td>' +
              '<td class="prospect-bio">'+profile.bio+'</td>' +
            '</tr>';

            // console.log('and were updating to: ' + profile.username);
            console.log('data we received...');
            console.log( pane.profile );
            // console.log(profileHtml);

            // jQuery( profileHtml )
            let profileDomObject = jQuery(profileHtml);
            outputContent.prepend( profileDomObject )
            profileDomObject.hide().slideDown('slow');

            // outputContent
            // .append( pane.profile ) // Update
            // .scrollTop(outputContent[0].scrollHeight); // Force scroll to bottom
          }
        }

        /*
         * Update preferences pane
         *
         */
        if (pane.type === 'preferences') {
        }
      }
    }
    else if ( typeof data === 'object' ) {
      console.log("Updating the Dashboard with an object");
      if (data.toggle) {
        console.log('Toggle Prospector');
      }
    }
    else {
      console.error("ACK! Asked to update Dashboard, with type '%s'", typeof data);
      return false;
    }
  }

  /**
  * Find hashtag photos items
  *
  */
  let getPageItems = () => {
    let out = ig_posts_recent.find( ig_items_selector_path );
    // out = out.slice(11); // For debugging quickly.
    return out;
  };


  /**
  * addListeners
  *
  * Add various needed Event Listeners
  */
  let addListeners = () => {

    // Buttons & Clickable icons
    prospectorIcon.on( 'click', toggleDashboard );
    prospectBtn.on( 'click', toggleProspector );
    exportBtn.on( 'click', exportCSV );

    // Links
    homeLink.on( 'click', () => { goToScreen('home') });
    outputLink.on( 'click', () => { goToScreen('output') });
    preferencesLink.on( 'click', () => { goToScreen('preferences') });

    // Preferences panel smart configuring
    preferencesPane.find('.delay').on('change', ( event ) => {
      let newDelay = parseInt( jQuery( event.currentTarget ).val(), 10 );
      preferences.delay = (newDelay) ? newDelay : 200;
      updateSessionPreferences();
    });
    preferencesPane.find('.include-header').on('click', ( event ) => {
      preferences.includeHeaders = event.currentTarget.checked;
      updateSessionPreferences();
    });
    preferencesPane.find('.asdsdsdfdf').on('click', ( event ) => {
      // @TODO get this working, Take fields from rpefs
      preferences.outputFields = event.currentTarget.checked;
      updateSessionPreferences();
    });

    // Listen for scroll
    jQuery(window).scroll( () => {
      if (jQuery(window).scrollTop() < 30) {
        dashboard.addClass('no-scroll'); // Triggers dashboard placement
      }
      else if ( dashboard.hasClass('no-scroll') ) {
        dashboard.removeClass('no-scroll'); // Triggers dashboard placement
      }

      // Keep the home screen count up to date
      // updateDashboard();
      let oldCount = parseInt(homePane.find('.count')[0].innerHTML, 10),
      items = getPageItems(),
      newCount = items.length;
      // console.log('Comparing... %d vs. %d', oldCount, newCount );

      if (oldCount !== newCount) {
        console.log('Updating items count...');
        updateDashboard([{
          type: 'home',
          count: newCount
        }]);
      }
    });

    // Listen for us starting the prospector
    dashboard.on('toggleProspector', () => {
      if (prospecting) {
        prospectUsersOnPage();
        goToScreen('output');
      }
      // else {
      //   let hasContent = dashboard.find('.output #out').text().length;
      //   if (hasContent) {
      //     exportBtn.show();
      //   }
      // }
    });

    // dashboard.on('screenoutput', () => {});
    // dashboard.on('screenhome', () => {});
    // dashboard.on('screenpreferences', () => {});
  }

  /**
  * updateSessionPreferences
  *
  * Stores our preferences in local storage.
  */
  let updateSessionPreferences = () => {
    sessionStorage.setItem('ng_prospector_preferences', JSON.stringify( preferences ));
  }


  /**
  * Toggle Prospector on and off
  *
  */
  let toggleProspector = () => {
    prospectBtn.text( prospecting ? 'Start 👉🏻' : 'Stop' );
    prospecting = !prospecting;
    dashboard
    .toggleClass('prospecting')
    .trigger('toggleProspector');
  }


  /**
  * Toggle the Dashboard UI
  *
  */
  let toggleDashboard = () => {
    console.log( 'Toggling dashboard...' );
    dashboardShowing = !dashboardShowing;
    ig_posts_popular.toggle();
    ig_main_content.css({ paddingTop: (dashboardShowing) ? 300 : 0 });
    dashboard.slideToggle().toggleClass('hidden');
  }

  /**
  * prospectUsersOnPage
  *
  * Scrape the photos on the page
  */
  let prospectUsersOnPage = () => {
    // Determine what kind of photo/page we're looking at
    let scrapeType = getPageType();

    if (scrapeType === 'hashtag') {
      // For now this should _always_ be true
      return scrapeHashtag();
    }
    else if (scrapeType === 'photo') {
      let user = getUsername();
      let profile = getProfileByUser( user );
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
    unformatted = getPageItems();

    console.log('Prospecting hashtag...');

    jQuery(unformatted).each((i, photo) => {
      let photoUrl = jQuery(photo).attr('href').split("?tagged=")[0];
      formatted.push( photoUrl );
    });

    // Scrape this list of photo urls
    if (!prospecting) { console.log('Prospecting stopped at #23'); }
    if (formatted.length && prospecting) {
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

        updateDashboard([{
          type: 'output',
          phase: 'username',
          username: username,
          count: usernames.length,
          countTotal: urls.length+usernames.length
        }]);

        usernames.push ( username );

        // console.log('(%d/%d) Getting owner of: %s ... %s', usernames.length+1, (urls.length+usernames.length)+1, url, username);

        if (!prospecting) { console.log('Prospecting stopped at #344'); }

        if (urls.length && prospecting) {
          // console.log('usernames scraped: %d (%d to go)', usernames.length, urls.length);
          setTimeout(() => { scrapeUsernamesFromPhotoUrls(urls, usernames); }, preferences.delay);
        }
        else if (prospecting) {
          // usernames = [].concat.apply([], usernames); // flatten array
          // console.log('Deduplicating username list from %d usernames', usernames.length);
          usernames = dedupe([].concat(usernames)); // deduplicate
          // console.log('Deduplicated username list to %d usernames', usernames.length);
          scrapeUserProfiles( usernames );
        }
      },
      error: () => {
        // @TODO: check for 404's
        return false;
      }
    };

    // Send request
    $.ajax( request_args );
  }


  /**
  * scrapeUserProfiles
  *
  * @param usernames Array Usernames to scrape
  */
  let scrapeUserProfiles = ( usernames = [] ) => {
    // Setup request
    let username = usernames.shift(),
    url = "https://www.instagram.com/{{username}}/?__a=1".replace("{{username}}", username ),
    request_args = {
      url: url,
      success: (result) => {
        result = result.user;

        let id, // Fields
        username,
        fullname,
        splitname,
        fname,
        lname,
        followers,
        following,
        profile_pic_url,
        profile_pic_url_hd,
        profile_url,
        bio,
        external_url,
        post_count,
        followed_by_user,
        follows_viewer,
        is_private,
        is_verified,
        blocked_by_viewer,
        has_blocked_viewer,
        full_profile,  // Function variables
        profile;

        // @TODO: Grab more data
        console.log('original result: '+result.username);


        id = (result.id) ? result.id : 0;
        username = (result.username) ? result.username : '';
        fullname = (result.full_name) ? result.full_name : '';
        splitname = (fullname) ? fullname.split(' ') : ['',''];
        fname = (splitname) ? (splitname.length > 0) ? splitname.shift() : '' : '';
        lname = (splitname) ? (splitname.length > 1) ? splitname.join(' ').trim() : '' : '';
        followers = (result.followed_by.count) ? result.followed_by.count : 0;
        following = (result.follows.count) ? result.follows.count : 0;
        profile_pic_url = (result.profile_pic_url) ? result.profile_pic_url : '';
        profile_pic_url_hd = (result.profile_pic_url_hd) ? result.profile_pic_url_hd : '';
        profile_url = (username) ? 'https://www.instagram.com/' + username : '';
        bio = cleanBio(result.biography);
        external_url = (result.external_url) ? result.external_url : '';
        post_count = (result.media.count) ? result.media.count : '';
        followed_by_user = (result.followed_by_user) ? result.followed_by_user : '';
        follows_viewer = (result.follows_viewer) ? result.follows_viewer : '';
        is_private = (result.is_private) ? result.is_private : '';
        is_verified = (result.is_verified) ? result.is_verified : '';
        blocked_by_viewer = (result.blocked_by_viewer) ? result.blocked_by_viewer : '';
        has_blocked_viewer = (result.has_blocked_viewer) ? result.has_blocked_viewer : '';

        console.log('applied result: '+username);

        full_profile = {
          "id": id,
          "username": username,
          "fullname": fullname,
          "splitname": splitname,
          "fname": fname,
          "lname": lname,
          "followers": followers,
          "following": following,
          "profile_pic_url": profile_pic_url,
          "profile_pic_url_hd": profile_pic_url_hd,
          "profile_url": profile_url,
          "bio": bio,
          "external_url": external_url,
          "post_count": post_count,
          "followed_by_user": followed_by_user,
          "follows_viewer": follows_viewer,
          "is_private": is_private,
          "is_verified": is_verified,
          "blocked_by_viewer": blocked_by_viewer,
          "has_blocked_viewer": has_blocked_viewer
        };
        profile = [username, fname, lname, '', followers, following, profile_url, bio, external_url, id];

        // console.log('(%d/%d) Getting profile of: %s ... OK!', profiles.length+1, (usernames.length+profiles.length)+1, username);
// console.log( full_profile );

        profiles.push( full_profile );

        updateDashboard([{
          type: 'output',
          phase: 'profile',
          username: username,
          profile: full_profile,
          count: profiles.length,
          countTotal: profiles.length+usernames.length
        }]);

        if (!prospecting) { console.log('Prospecting stopped at #2267'); }

        if (usernames.length && prospecting) {
          setTimeout(() => { scrapeUserProfiles(usernames); }, preferences.delay);
        }
        else {
          // outputProspectProfiles( profiles );
          toggleProspector();
        }
      },
      error: () => {
        // @TODO: check for 404's
        return false;
      },
      dataType: 'json'
    };

    $.ajax( request_args );
  }

  /**
  * Clean up biographies
  *
  * Ensures our CSV doesn't choke invalid characters
  *
  */
  let cleanBio = (bio = '' ) => {
    let cleanedBio;

    bio = ( bio ) ? bio : '';

    if ( (typeof bio === 'string') && bio.length ) {
      cleanedBio = bio;
      cleanedBio = cleanedBio.replace(/"/g, ' ').trim();
      cleanedBio = cleanedBio.replace(/(\r\n|\n|\r)/gm,"");
      cleanedBio = '"' + cleanedBio + '"';
    }
    else {
      cleanedBio = '';
    }

    return cleanedBio;
  }


  /**
  * outputProspectProfiles
  *
  * @param profiles Array of scraped profiles
  */
  let outputProspectProfiles = ( profiles = [] ) => {
    let scrapeId,
    myWindow,
    scrapeDate = new Date(),
    scrapeData = "",
    source = getTitle();

    profiles.map( (profile) => {
      scrapeData = profile.join(",") + "\r";
    });

    outputContent.innerHTML = scrapeData;

    goToScreen('output');
    updateDashboard();
  }


  /**
  * Change screens on Dashboard
  *
  * @param screen String of pane to switch to
  */
  let goToScreen = ( screen ) => {
    dashboard
    .removeClass( currentState )
    .addClass( screen )
    .trigger( 'screen'+screen );

    currentState = screen;
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
        profile_url = 'https://instagram.com/' + username,
        bio = '"' + result.biography + '"',
        external_url = (result.external_url) ? result.external_url : '',
        id = result.id,
        profile = [username, fname, lname, '', followers, following, profile_url, bio, external_url, id];


        return profile;
      },
      error: () => {
        // @TODO: check for 404's
        return false;
      },
      dataType: 'json'
    };

    $.ajax( request_args );
  }


  /**
  * Export scrape as CSV file.
  *
  * Creates a download of the scraped data. Includes a DOM hack so we can customize the filename.
  */
  let exportCSV = () => {
    if (profiles.length) {
      let encodedUri,
      link = document.createElement("a"),
      now = new Date(),
      hashtag = (getPageType() === 'hashtag') ? getTitle().substring(1) : '',
      dY4 = now.getFullYear(),                  // 4 char year
      dM1 = (now.getMonth() + 1),               // 1 char month
      dM2 = ("0" + now.getMonth()).slice(-2),   // 2 char month
      dD2 = ("0" + now.getDate()).slice(-2),    // 2 char day
      dH2 = ("0" + now.getHours()).slice(-2),   // 2 char hour
      dm2 = ("0" + now.getMinutes()).slice(-2), // 2 char minute
      filename = "prospects-" + hashtag + "-" + dY4 + dM2 + dD2 + "_" + dH2 + dm2 + ".csv",
      csvContent = "data:text/csv;charset=utf-8,";

      if (preferences.includeHeaders) {
        csvContent += preferences.outputFields.join(",") + '\n';
      }

      profiles.forEach((profile, index) => {

        // console.log('New profile...');
        // console.log( profile );

        let dataString,
        outFields = preferences.outputFields;

        console.log(outFields);
        outFields.forEach((field, index2) => {
          console.log("%s is: %s", field, profile[field] );
          let tmpField = (field.toLowerCase() !== 'blank') ? profile[ field ] : '';
          dataString += (index2 < outFields.length) ? tmpField+ "," : tmpField;
        });

        csvContent += (index < profiles.length) ? dataString+ "\n" : dataString;
      });

      // Auto-download
      encodedUri = encodeURI(csvContent);
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link); // Required for FF
      link.click();
    }
    else {
      console.log('Ack! There is no profile data to export.');
    }
  }

  /**
  * getPageType
  *
  */
  let getPageType = () => {
    let title,
    isHashtag,
    pageType = false,
    isPhoto = is_photo(),
    isProfile = is_profile();

    if ( is_photo() ) {
      pageType = 'photo';
    }
    else if ( is_profile() ) {
      title = getTitle();
      isHashtag = title.includes('#');
      pageType = ( isHashtag ) ? 'hashtag' : 'profile';
    }

    console.log( "Identified page type as '%s'...", pageType );
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
  let dedupe = (arr) => {
    return arr.filter((elem, pos, arr2) => {
      return arr2.indexOf(elem) == pos;
    });
  }


  // All aboard!
  init();

});
