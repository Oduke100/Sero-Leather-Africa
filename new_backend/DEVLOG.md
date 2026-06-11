This is the second DB for sero Leather
I want this to be better, the first was like soo amateur, so we are starting fresh.
ofc we start with the db:
    in the db I have decided after consultations and research the best approach is to have a table for
        category
        product
        variant (this is like when an object"product" exists in XL, L, and S)
        orders
        order items

so to start off its the models file to create this tables
the three tables have been written well, I added;
    is on discount: if yes, the logic will automatically calculate the discount price and show it
    is customisale: if yes, we will add sth like what she sent in the group, ile ya idk which website where its a form and the customer can say what they want
    slug: this has been clearly stated in a comment in the code
    and ofc from the start category


I still think this BE the boggest problem will be intergrating it with the FE, especially since I feel we should move to a react FE and quit the amateur stuff we have rn, but I guess we will have to see, I am inclined to the FE change, ofc we wont change what people see but the Behind the scenes of that FE will be a big revamp!
I always thought this was starter stuff so It just has to be perfect

the schemas are done(learn how inheritance works irl)
so I have decided I want the routes in a separate file to the main, idk it just sounds right(the routes is where we write the APIs so that is what I am going to do)

all the routes have been made the post, read, update and delete (I broke a flask in the process)
but now I want that new FE framework I said(ofc all of it will be claude) but the design will still be the old one, just the behind the scenes of the FE is what will change
