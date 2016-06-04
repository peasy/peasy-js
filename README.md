![peasy-js](https://www.dropbox.com/s/2yajr2x9yevvzbm/peasy3.png?dl=0&raw=1)

###A middle tier framework for javascript

peasy-js is a simple middle tier framework that offers/addresses the following:

- Easy to use [business rules and validation rules](https://github.com/peasy/peasy-js/wiki/Business-and-Validation-Rules) engine
- [Scalability](https://github.com/peasy/peasy-js/wiki/Data-Proxy#scalability)
- Reusability (decouples business validation logic from other frameworks)
- [Swappable](https://github.com/peasy/peasy-js/wiki/Data-Proxy#swappable-data-proxies) [data proxies](https://github.com/peasy/peasy-js/wiki/Data-Proxy)
- [Multiple client support](https://github.com/peasy/peasy-js/wiki/Multiple-Client-Support)
- [Multiple deployment scenario support](https://github.com/peasy/peasy-js/wiki/Data-Proxy#multiple-deployment-scenarios)
- [Easy testability](https://github.com/peasy/peasy-js/wiki/Testing)
- [AMD](https://en.wikipedia.org/wiki/Asynchronous_module_definition), Browser, and [CommonJS](https://en.wikipedia.org/wiki/CommonJS) support


#Getting started

You can get started by reviewing the getting started example below.

- I want to run it in a [client](https://github.com/peasy/peasy-js/wiki/Browser-sample) (browser)
- I want to run it on a [server](https://github.com/peasy/peasy-js/wiki/node.js-sample) (Node.js)

An additional sample can be viewed [here](https://github.com/peasy/peasy-js/blob/master/src/sample.js) that showcases creating a [business service](), custom [command](), [business rules](), and wiring them up.  The sample also showcases how to consume the service.  To see it in action, just run: ```node src/sample.js``` from a command line.

For additional help, be sure to checkout the wiki as it covers in-depth how-to's, general framework design, and usage scenarios.

#What's a middle tier framework?

A middle tier framework is code that facilitates creating business logic in a reusable, extensible, maintainable, and testable manner.   It promotes creating business logic that is completely decoupled from its consuming technologies and helps to ensure that separation of concerns ([SoC](https://en.wikipedia.org/wiki/Separation_of_concerns)) are adhered to.

#Why peasy-js?

Because the javascript ecosystem changes at a pace much more rapid than your business logic.  UI frameworks change: Backbone one day, Angular the next day, React the following...  Backend frameworks change: Express one day, Koa the next day, Hapi the next... Data frameworks and ORMS change...  

Why couple your code to technologies that are hot today and gone tomorrow?  Why not focus on your business logic and abstract out everything else into truly reusable code that can be consumed by javascript in the browser, backend, or both, and by any UI or backend framework? 

Using peasy-js makes it trivial to whimsically swap out UI, backend, and data frameworks in your applications.

#Where can I get it?

- [Download the latest release](https://github.com/peasy/peasy-js/archive/master.zip).
- Clone the repo: ```git clone https://github.com/peasy/peasy-js.git```.
- Install with npm: ```npm install peasy-js```.

You can also download and add the [peasy.js](https://github.com/peasy/peasy-js/blob/master/src/peasy.js) file to your project and reference it accordingly.

#Contributing

All contributions are welcome, from general framework improvements to sample client consumers, proxy implementations, and documentation updates.  Want to get involved?  Please hit us up with your ideas.  Alternatively, you can make a pull request and we'll get to it ASAP.

#Like what you see?

Please consider showing your appreciation by starring the project.
