import React, { useEffect, useState } from 'react';
import DynamicComponent from '../DynamicComponent';
import { forkJoin, of, zip } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { switchMap, map } from 'rxjs/operators';
import Cookies from 'js-cookie';
import { ContentStoreService } from '@craftercms/content';
import { crafterConf } from '@craftercms/classes';
import { useDropZone, useICE } from '../../services/util';

const crafterConfig = {
  ...crafterConf.getConfig(),
  site: Cookies.get('crafterSite'),
  baseUrl: '  '
};

function getPageRecipe(setState) {

  // fetch('/api/page.json?id=/site/website/index.xml')
  //   .then(response => response.json())
  //   .then(data => setState(data));

  ajax.post(
    '/api/1/site/graphql',
    {
      query: `
        query Page {
          page_entry {
            items {
              label: internal__name
              path: localId
              col1 {
                item {
                  path: key
                  label: value
                  component {
                    objectId
                    content__type
                    ...on component_rich__text {
                      copy
                      label: internal__name
                    }
                  }
                }
              }
            }
          }
          component_main {
            items {
              label: internal__name
              path: localId
              col1 {
                item {
                  path: key
                  label: value
                  component {
                    objectId
                    content__type
                    ...on component_rich__text {
                      copy
                      label: internal__name
                    }
                  }
                }
              }
            }
          }
        }
        `
    },
    { 'Content-Type': 'application/json' }
  ).pipe(
    map(({ response }) => response.data),
    switchMap((data) => {
      let items = data.page_entry?.items[0]?.col1?.item;
      if (!items) {
        return of(null);
      }
      if (!Array.isArray(items)) {
        items = [items];
      }
      // FYI: Only fetches up to second level drop zone content...
      return zip(of(data), forkJoin(
        items
          .flatMap((item) =>
            (item.component?.content__type === '/component/main')
              ? [
                // Add the drop zone itself plus...
                item.path,
                // ...all of it's immediate children
                ...[
                  // The GraphQL query already pre-includes this content type. Fetch the current
                  // entry to find it's children.
                  data.component_main.items.find((component) => component.path === item.path)
                ].filter(i => i !== null).flatMap((colItem) =>
                  (colItem?.col1?.item) ? colItem.col1.item.map((i) => i.path).filter(path => path.startsWith('/')) : []
                )
              ] : (
                // If it doesn't start with /, it's embedded so skip
                item.path.startsWith('/')
                  ? [item.path]
                  : []
              )
          )
          .concat(data.page_entry?.items[0].path)
          .reduce((table, path) => {
            table[path] = ContentStoreService.getDescriptor(path, crafterConfig).pipe(
              map(desc => desc.component || desc.page)
            );
            return table;
          }, {})
      ));
    }),
    map(([data, descriptors]) => {
      const createEmbeddedDescriptor = (item, path) => ({
        'content-type': item.component.content__type,
        copy: item.component.copy,
        objectId: item.component.objectId,
        cmsId: `${path}:${item.component.objectId}`
      });
      // Put together the data as this app currently expects it.
      // Serving the components ids only and serving the descriptors lookup table
      // via react context would avoid this manual mapping.
      Object.entries(descriptors).forEach(([path, desc]) => desc.cmsId = path);
      const response = descriptors['/site/website/index.xml'];
      response.col1 = {
        cmdId: '',
        item: data.page_entry?.items[0]?.col1?.item.map((item) => {
          if ((item.component.content__type === '/component/main')) {
            descriptors[item.path].col1 = {
              cmsId: '',
              item: data.component_main.items
                .find((component) => component.path === item.path)?.col1?.item
                .map(i => descriptors[i.path] || createEmbeddedDescriptor(i, item.path))
            };
          } else if (!item.path.startsWith('/')) {
            return createEmbeddedDescriptor(item, '/site/website/index.xml');
          }
          return descriptors[item.path];
        })
      };
      return response;
    })
  ).subscribe((data) => {
    setState(data);
  });

}

export default function App() {

  const [state, setState] = useState();
  const { props: ice } = useICE({ path: state?.cmsId, modelId: state?.objectId });
  const { props: dnd } = useDropZone({
    path: state?.cmsId,
    modelId: state?.objectId,
    contentType: '/page/entry',
    zoneName: 'col1'
  });

  useEffect(() => {
    getPageRecipe(setState);
  }, []);

  return (!state) ? 'No data is available to be rendered.' : (
    <div {...ice}>
      <div {...dnd}>
        {
          (state?.col1?.item)
            ? <DynamicComponent items={state.col1.item}/>
            : <em>(col1 has no item)</em>
        }
      </div>
    </div>
  );

}
