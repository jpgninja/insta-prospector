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
    jQuery('#out .export-csv').on('click', exportCSV);
    jQuery('#out .copy-to-clipboard').on('click', copyToClipboard);
    // jQuery('body main article > div:nth(1) > a').on('click', () => { console.log('clicked!'); });
    // jQuery(document).on('scroll', scrollHandler);
  }


  /**
   * exportCSV
   *
   * Export as CSV.
   *
   * @TODO: Untested.
   * @TODO: filename
   */
  let exportCSV = () => {
    let dt = new Date(),
      filestamp = dt.getFullYear() + (dt.getMonth() + 1) + dt.getDate() + '_' + dt.getHours() + dt.getMinutes(),
      filename = scrape.source.toLowerCase().replace(/[^a-z0-9]+/g, ""),
      filetype = 'csv',
      fileout = filestamp + '_' + filename + '.' + filetype,
      csvUrl = '',
      csvHeader = 'data:text/csv;charset=utf-8,',
      csvContent = $('#out textarea').val();

    console.log("Exporting as '%s'", fileout);

    csvHeader += 'username, fname, lname,  email,  followers,  following,  profile,  bio,  url, id\n';
    csvUrl = encodeURI( csvHeader + csvContent );

    window.open(csvUrl, '_blank');
  }

  // @TODO: everything
  let copyToClipboard = () => {
    console.log("Copying data to clipboard...");
  }

  /**
   * Boolean functions
   *
   */


  /**
   * Getters
   *
   */


  // All aboard!
  init();

});
