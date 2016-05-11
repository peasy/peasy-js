![peasy-js](https://www.dropbox.com/s/2yajr2x9yevvzbm/peasy3.png?dl=0&raw=1)

###An easy to use middle tier framework for javascript

Peasy-js is a simple middle tier framework that offers/addresses the following:

- Easy to use [validation](https://github.com/peasy/Peasy.NET/wiki/Validation-Rules)/[business rules](https://github.com/peasy/Peasy.NET/wiki/Business-Rules) engine
- [Thread safety](https://github.com/peasy/Peasy.NET/wiki/Thread-Safety)
- [Scalability](https://github.com/peasy/Peasy.NET/wiki/data-proxy#scalability)
- [Concurrency](https://github.com/peasy/Peasy.NET/wiki/BusinessServiceBase#concurrency-handling)
- [Swappable](https://github.com/peasy/Peasy.NET/wiki/data-proxy#swappable-data-proxies) [data proxies](https://github.com/peasy/Peasy.NET/wiki/Data-Proxy)
- [Async support](https://github.com/peasy/Peasy.NET/wiki/The-Asynchronous-Pipeline)
- [Multiple client support](https://github.com/peasy/Peasy.NET/wiki/Multiple-client-support)
- [Multiple deployment scenario support](https://github.com/peasy/Peasy.NET/wiki/data-proxy#multiple-deployment-scenarios)
- [Transactional support and fault tolerance](https://github.com/peasy/Peasy.NET/wiki/ITransactionContext)
- [Easy testability](https://github.com/peasy/Peasy.NET/wiki/Testing)

#What's a middle tier framework?

Simply put, it's code that facilitates creating reusable, extendable, maintainable, and testable code.  A middle tier framework places focus on creating business logic that is completely decoupled from its consuming technologies.

#Why peasy-js?

Because the javascript ecosystem changes at a pace much more rapid than your business logic.  UI frameworks change: Backbone one day, Angular the next day, React the next...  Backend frameworks change: express one day, koa the next day, hapi the next... Data frameworks change.  

Why couple your code to technologies that are hot today and gone tomorrow?  Focus on your business logic and abstract out everything else into truly reusable code that can be consumed by javascript in the browser, backend, or both!  

Using peasy-js makes it trivial to swap UI, Backend, and Data frameworks on a whim.

#Where can I get it?

- [Download the latest release](https://github.com/peasy/peasy-js/archive/master.zip).
- Clone the repo: ```git clone https://github.com/peasy/peasy-js.git```.
- Install with npm: ```npm install peasy-js```.

You can also download and add the peasy.js file to your project and reference it accordingly.

#Getting started

You can get started by reviewing the [getting started example](https://github.com/peasy/peasy-js/wiki#the-simplest-possible-example) on the Peasy wiki.  The wiki also covers in-depth how-to's, general framework design, and usage scenarios.

A simple sample can be viewed [here](https://github.com/peasy/peasy-js/blob/master/src/sample.js) that showcases creating a [business service](), custom [command](), [business rules](), and wiring them up.  The sample also showcases how to consume the service.  To see it in action, just run: ```node sample.js``` from a command line.

#Contributing

All contributions are welcome, from general framework improvements to sample client consumers, proxy implementations, and documentation updates.  Want to get involved?  Please hit us up with your ideas.  Alternatively, you can make a pull request and we'll get to it ASAP.

#Like what you see?

Please consider showing your appreciation by starring the project.
