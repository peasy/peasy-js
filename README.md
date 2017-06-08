![peasy-js](https://www.dropbox.com/s/2yajr2x9yevvzbm/peasy3.png?dl=0&raw=1)

```javascript
A middle tier framework for javascript
```
<p align="center">
	<a href="https://www.npmjs.com/package/peasy-js" target="_blank">
		<img src="https://badge.fury.io/js/peasy-js.svg" alt="npm version">
	</a>
</p>

# What's a middle tier framework?

A middle tier framework is code that facilitates creating business logic in a reusable, extensible, maintainable, and testable manner.   It promotes creating business logic that is completely decoupled from its consuming technologies and helps to ensure that separation of concerns ([SoC](https://en.wikipedia.org/wiki/Separation_of_concerns)) are adhered to.

##### peasy-js offers/addresses the following:

- Easy to use [business and validation rules](https://github.com/peasy/peasy-js/wiki/Business-and-Validation-Rules) engine
- [Scalability](https://github.com/peasy/peasy-js/wiki/Data-Proxy#scalability)
- Reusability (decouples business and validation logic from consuming code and frameworks)
- [Swappable](https://github.com/peasy/peasy-js/wiki/Data-Proxy#swappable-data-proxies) [data proxies](https://github.com/peasy/peasy-js/wiki/Data-Proxy)
- [Multiple client support](https://github.com/peasy/peasy-js/wiki/Multiple-Client-Support)
- [Multiple deployment scenario support](https://github.com/peasy/peasy-js/wiki/Data-Proxy#multiple-deployment-scenarios)
- [Easy testability](https://github.com/peasy/peasy-js/wiki/Testing)
- [AMD](https://en.wikipedia.org/wiki/Asynchronous_module_definition), Browser, and [CommonJS](https://en.wikipedia.org/wiki/CommonJS) support
- Zero dependencies

# Why peasy-js?

Because the javascript ecosystem changes at a pace much more rapid than your business logic.  UI frameworks change: Backbone one day, Angular the next day, React the following...  Backend frameworks change: Express one day, Koa the next day, Hapi the next... Data frameworks and ORMS change...  

Why couple your code with technologies that are hot today and gone tomorrow?  Why not focus on your business logic and abstract out everything else into truly reusable code that can be consumed by javascript in the browser, backend, or both, and by any UI or backend framework? 

peasy-js makes it trivial to whimsically swap out UI, backend, and data frameworks in your applications by creating your business logic in a composable, reusable, scalable, and testable manner.

# Where can I get it?

- [Download the latest release](https://github.com/peasy/peasy-js/archive/master.zip).
- Clone the repo: ```git clone https://github.com/peasy/peasy-js.git```.
- Install with npm: ```npm install peasy-js```.
- Install with bower: `bower install peasy-js`.

You can also download and add the [peasy.js](https://github.com/peasy/peasy-js/blob/master/lib/peasy.js) file to your project and reference it accordingly.

# Getting started

You can get started by reviewing the walk throughs below.

- Run it in a [client](https://github.com/peasy/peasy-js/wiki/Browser-sample) (browser)
- Run it on a [server](https://github.com/peasy/peasy-js/wiki/node.js-sample) (Node.js)

An additional sample can be viewed [here](https://github.com/peasy/peasy-js/blob/master/src/sample.js) that showcases creating a [business service](), custom [command](), [business rules](), and wiring them up.  The sample also showcases how to consume the service.  To see it in action, run: ```node src/sample.js``` from a command line.

An entire middle-tier implementation using peasy-js can be viewed [here](https://github.com/peasy/peasy-js-samples).  This sample application is a ficticious order entry / inventory management system.

For additional help, be sure to checkout the [wiki](https://github.com/peasy/peasy-js/wiki) as it covers in-depth how-to's, general framework design, and usage scenarios.

# Contributing

All contributions are welcome, from general framework improvements to sample client consumers, proxy implementations, and documentation updates.  Want to get involved?  Please hit us up with your ideas.  Alternatively, you can make a pull request and we'll get to it ASAP.

# Like what you see?

Please consider showing your support by starring the project.
