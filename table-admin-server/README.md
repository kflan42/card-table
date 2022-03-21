# Table Admin Server

This was an attempt to move some operations scripts into a service.
However, the python-based processing of card data proved too memory intensive to fit into the free tier.
I was unable to find a nice python library allowing streaming processing of json data.
Therefore, this service was abandoned and is not currently used.

Instead, I utilzed a Cloud Function.