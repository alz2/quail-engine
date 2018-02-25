# quail-engine

### Motivation ###
Modern search engines are incredibly powerful... But they aren't perfect! We seek to improve information retrieval by trying combine the effectiveness of various search engines such as Google, Baidu, and Yahoo Japan. There are cases where sometimes a user is looking for a document or information which doesn't get ranked high on the current browser, but gets ranked high with the same query on a different browser. For example, Changming was stuck on a particular math problem and seeked help from Google. However, Google did not have the information that he was looking for so he turned to Baidu, which actually had it. Given a query, quail will translate the query to the dominate language of each of its supported search engines, retrieve the highest ranked documents, and then provide links and translated titles back to the user.

In addition, as we are polling the dominate search engines in various countries, a user can get a sense of the various cultures of America (Google), Yahoo (Japan), Baidu(China) as queries will sometimes mean different things in different cultures. 

We hope that quail, or at least the idea of quail, helps make information more readily available for everyone!

### Technical Flow ###
```
                    
                    |--- QUERY(JAPANESE) -- YAHOO JP --- RESULTS(JAPANESE) ---|
                    |                                                         |
QUERY(Language q) --|--- QUERY(CHINESE) --- BAIDU ------ RESULTS(CHINESE) ----|----- RESULTS(LANGUAGE q)
                    |                                                         |
                    |--- QUERY(ENGLISH) --- GOOGLE ----- RESULTS(ENGLISH) ----|
