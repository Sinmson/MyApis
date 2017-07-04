var app = new Vue({
  el: "#app",
  data: {
    results: [],
    inputUrl: "https://www.immowelt.de/liste/leipzig/wohnungen/mieten?prima=450&wflmi=50&wflma=65&roomi=2&sort=relevanz",
    page: 1
  },
  watch: {
    results: function(oldVa, newVal)    {
      console.log("updated");
    }
  },
  computed: {
    resultsSortedByDate: function() {
      var resultsSortedByDate = this.results.sort(function(a,b) {
        return new Date(b.date) - new Date(a.date);
      });
      return resultsSortedByDate;
    }
  },
  methods: {
     loadSearchResults: function(page)
    {
      var usingUrl = this.inputUrl + "&cp=" + this.page;
      $.post("http://localhost:3000/api/immowelt/search",
      {
        url: usingUrl
      },
      (results) => {
        console.log("this", this);
        for (var i = 0; i < results.length; i++)
        {
          this.addSearchResult(results[i]);
        }
      });
    },
    addSearchResult: function(result)
    {
      var dateToPrint =  new Date(result.date);
      dateToPrint = dateToPrint.getDate() + '.' + (dateToPrint.getMonth()+1) + '.' +  dateToPrint.getFullYear();
      result.dateToPrint = dateToPrint;
      this.results.push(result);
      // $("#results").append("<div class='flexbox column cell expose'><strong class='cell'>" + result.title +"</strong><div class='flexbox cell'><span>" + dateToPrint +"</span><span>---" + result.dateStr +"---</span></div></div>")
    }
  }
});
